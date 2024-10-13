import fs, { link } from 'fs';
import path from 'path';
import { parse } from 'acorn';
import { compoundSyntaxNodes, extractStatements, generateSource, extractExpressions, memberSyntaxNodes, extractFunctionDeclarations } from './syntax.js';
import { firstStatementPrompt, subsequentStatementPrompt, generatePrompts, fetchPromptAnswersAsync, expressionPrompt, generatePrompt, classificationPrompt, functionPrompt } from './chatgpt.js';

const inputFilePath = 'input/hello-world-button.js';
const referenceDirectoryPath = 'input/references/';
const outputDirectoryPath = 'output/hello-world-button/';

const functionFilePath = `${outputDirectoryPath}functions.json`;
const statementFilePath = `${outputDirectoryPath}statements.json`;
const expressionFilePath = `${outputDirectoryPath}expressions.json`;
const appliedReferenceFilePath = `${outputDirectoryPath}references.json`; 

const inputFileContent = fs.readFileSync(inputFilePath, 'utf-8');
const syntaxTree = parse(inputFileContent, { ecmaVersion: "latest" });
const statements = extractStatements(compoundSyntaxNodes, syntaxTree);

if (!fs.existsSync(functionFilePath)) {
    const codeReferences = [];

    for(let functionDeclaration of extractFunctionDeclarations(syntaxTree)) {
        const functionSource = generateSource(inputFileContent, functionDeclaration);
        const prompt = functionPrompt.replace("{0}", functionSource);
        const promptAnswer = (await fetchPromptAnswersAsync([prompt]))[0];
        
        codeReferences.push({
            type: "function",
            start: functionDeclaration.start,
            end: functionDeclaration.end,
            description: promptAnswer
        });
    }

    const outputFileContent = JSON.stringify(codeReferences, null, 2);
    fs.mkdirSync(outputDirectoryPath, { recursive: true });
    fs.writeFileSync(functionFilePath, outputFileContent);
}

if (!fs.existsSync(statementFilePath)) {
    const statementsAsStrings = statements.map(s => generateSource(inputFileContent, s));
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

    const outputFileContent = JSON.stringify(codeDescriptions, null, 2);

    fs.mkdirSync(outputDirectoryPath, { recursive: true });
    fs.writeFileSync(statementFilePath, outputFileContent);
}

if (!fs.existsSync(expressionFilePath)) {
    const codeDescriptions = [];

    for(let statement of statements) {
        const expressions = [...extractExpressions(memberSyntaxNodes, statement), statement];
        if (expressions.length <= 2)
            continue;

        const promptListElements = expressions.map(e => generateSource(inputFileContent, e));
        const promptList = "- " + promptListElements.join('\n- ');
        const prompt = generatePrompt(expressionPrompt, promptList);
        const promptAnswer = await fetchPromptAnswersAsync([prompt]);
        
        codeDescriptions.push({
            type: "expression",
            start: statement.start,
            end: statement.end,
            description: promptAnswer
        });
    }

    const outputFileContent = JSON.stringify(codeDescriptions, null, 2);
    fs.mkdirSync(outputDirectoryPath, { recursive: true });
    fs.writeFileSync(expressionFilePath, outputFileContent);
}

if (!fs.existsSync(appliedReferenceFilePath)) {
    // Fetch available reference
    const referenceCollections = []; 
    for(let referenceFile of fs.readdirSync(referenceDirectoryPath)) {
        const referenceFilePath = path.join(referenceDirectoryPath, referenceFile);
        const referenceFileContent = fs.readFileSync(referenceFilePath, 'utf-8');
        const referenceFileCollection = JSON.parse(referenceFileContent);

        referenceCollections.push(referenceFileCollection);
    }

    // Find applied references per statement
    const codeReferences = [];
    for(let statement of statements) {
        for (let referenceCollection of referenceCollections) {
            const statementSource = generateSource(inputFileContent, statement);
            const referenceList = referenceCollection.map(s => s.text.trim()).join(", "); 
            const prompt = classificationPrompt.replace("{0}", statementSource).replace("{1}", referenceList);
            const promptAnswer = (await fetchPromptAnswersAsync([prompt]))[0];
            
            for(let reference of referenceCollection) {
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

    const outputFileContent = JSON.stringify(codeReferences, null, 2);
    fs.mkdirSync(outputDirectoryPath, { recursive: true });
    fs.writeFileSync(appliedReferenceFilePath, outputFileContent);
}