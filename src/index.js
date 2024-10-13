import fs from 'fs';
import { parse } from 'acorn';
import { compoundSyntaxNodes, extractStatements, generateSource, extractExpressions, memberSyntaxNodes } from './syntax.js';
import { firstStatementPrompt, subsequentStatementPrompt, generatePrompts, fetchPromptAnswersAsync, expressionPrompt, generatePrompt } from './chatgpt.js';

const inputFilePath = 'input/hello-world-button.js';
const outputDirectoryPath = 'output/hello-world-button/';

const statementFilePath = `${outputDirectoryPath}statements.json`;
const expressionFilePath = `${outputDirectoryPath}expressions.json`;

const inputFileContent = fs.readFileSync(inputFilePath, 'utf-8');
const syntaxTree = parse(inputFileContent, { ecmaVersion: "latest" });
const statements = extractStatements(compoundSyntaxNodes, syntaxTree);

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