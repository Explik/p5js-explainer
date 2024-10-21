import fs from 'fs';
import path from 'path';
import { parse } from 'acorn';
import { firstStatementPrompt, subsequentStatementPrompt, firstExpressionPrompt, classificationPrompt, functionPrompt, subsequentExpressionPrompt } from './prompts.js';
import { fetchPromptAnswerAsync, fetchPromptAnswersAsync, generateFileIfNonExistentAsync, generatePrompt, generatePrompts, compoundSyntaxNodes, extractStatements, generateSource, extractExpressions, memberSyntaxNodes, extractFunctionDeclarations, getFileNames, getFilePaths } from '../shared/utils.js';

const inputDirectory = 'data';
const referenceDirectory = 'data/references';
const temporaryDirectory = 'public/cache';
const outputDirectory = 'public';

// Fetch available reference
const referenceCollections = [];
for (let referenceFilePath of getFilePaths(referenceDirectory)) {
    const referenceFileContent = fs.readFileSync(referenceFilePath, 'utf-8');
    const referenceFileCollection = JSON.parse(referenceFileContent);

    referenceCollections.push(referenceFileCollection);
}

// Setup output directories
fs.mkdirSync(temporaryDirectory, { recursive: true });
fs.mkdirSync(outputDirectory, { recursive: true });

// Generate output files
for (let inputFileName of getFileNames(inputDirectory)) {
    const inputFilePath = path.join(inputDirectory, inputFileName);
    const inputFileNameWithoutExtension = inputFileName.split('.').slice(0, -1).join('.');
    const currentTemporaryDirectory = path.join(temporaryDirectory, inputFileNameWithoutExtension);

    const sourceCode = fs.readFileSync(inputFilePath, 'utf-8');
    const syntaxTree = parse(sourceCode, { ecmaVersion: "latest" });
    const statements = extractStatements(compoundSyntaxNodes, syntaxTree);

    const functionFilePath = path.join(currentTemporaryDirectory, 'functions.json');
    await generateFileIfNonExistentAsync(functionFilePath, async () => {
        const codeReferences = [];

        for (let node of extractFunctionDeclarations(syntaxTree)) {
            const nodeSource = generateSource(sourceCode, node);
            const prompt = generatePrompt(functionPrompt, nodeSource);
            const promptAnswer = await fetchPromptAnswerAsync(prompt);

            codeReferences.push({
                type: "function",
                start: node.start,
                end: node.end,
                description: promptAnswer
            });
        }
        return JSON.stringify(codeReferences, null, 2);
    });

    const statementFilePath = path.join(currentTemporaryDirectory, 'statements.json');
    await generateFileIfNonExistentAsync(statementFilePath, async () => {
        const statementsAsStrings = statements.map(s => generateSource(sourceCode, s));
        const statementsAsPrompts = generatePrompts(firstStatementPrompt, subsequentStatementPrompt, statementsAsStrings);
        const statementsAsPromptAnswers = await fetchPromptAnswersAsync(statementsAsPrompts);

        const codeDescriptions = [];
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];

            codeDescriptions.push({
                type: "statement",
                start: statement.start,
                end: statement.end,
                description: statementsAsPromptAnswers[i]
            });
        }
        return JSON.stringify(codeDescriptions, null, 2);
    });

    const expressionFilePath = path.join(currentTemporaryDirectory, 'expressions.json');
    await generateFileIfNonExistentAsync(expressionFilePath, async () => {
        const codeDescriptions = [];

        for (let statement of statements) {
            const expressions = [...extractExpressions(memberSyntaxNodes, statement), statement];
            if (expressions.length <= 2)
                continue;

            const expressionsAsPrompts = expressions.map(e => generateSource(sourceCode, e));
            const prompts = generatePrompts(firstExpressionPrompt, subsequentExpressionPrompt, expressionsAsPrompts);
            const promptAnswers = await fetchPromptAnswersAsync(prompts);

            for (let i = 0; i < expressions.length; i++) {
                codeDescriptions.push({
                    type: "expression",
                    start: statement.start,
                    end: statement.end,
                    description: promptAnswers[i]
                });
            }            
        }
        return JSON.stringify(codeDescriptions, null, 2);
    });

    const appliedReferenceFilePath = path.join(currentTemporaryDirectory, 'references.json');
    await generateFileIfNonExistentAsync(appliedReferenceFilePath, async () => {
        // Find applied references per statement
        const codeReferences = [];
        for (let statement of statements) {
            for (let referenceCollection of referenceCollections) {
                const statementSource = generateSource(sourceCode, statement);
                const referenceList = referenceCollection.map(s => s.text.trim()).join(", ");
                const prompt = classificationPrompt.replace("{0}", statementSource).replace("{1}", referenceList);
                const promptAnswer = await fetchPromptAnswerAsync(prompt);

                for (let reference of referenceCollection) {
                    const referenceText = reference.text.trim();

                    if (promptAnswer.includes(referenceText)) {
                        codeReferences.push({
                            type: "reference",
                            start: statement.start,
                            end: statement.end,
                            text: reference.text,
                            link: reference.link
                        });
                    }
                }
            }
        }
        return JSON.stringify(codeReferences, null, 2);
    });

    // Generate bundle file
    const bundleFilePath = path.join(outputDirectory, inputFileNameWithoutExtension + '.json');
    const bundleFileObject = {
        source: sourceCode,
        functions: JSON.parse(fs.readFileSync(functionFilePath, 'utf-8')),
        statements: JSON.parse(fs.readFileSync(statementFilePath, 'utf-8')),
        expressions: JSON.parse(fs.readFileSync(expressionFilePath, 'utf-8')),
        references: JSON.parse(fs.readFileSync(appliedReferenceFilePath, 'utf-8'))
    };
    const bundleFileContent = JSON.stringify(bundleFileObject, null, 2);
    fs.writeFileSync(bundleFilePath, bundleFileContent);
}

// Generate index file 
const indexFilePath = path.join(outputDirectory, 'index.json');
const indexFileContnet = JSON.stringify(getFileNames(inputDirectory), null, 2);
fs.writeFileSync(indexFilePath, indexFileContnet);