import fs from 'fs';
import cors from 'cors';
import express from 'express';
import { parse } from 'acorn';
import { compoundSyntaxNodes, extractStatements, extractFunctionDeclarations, extractExpressions, memberSyntaxNodes, generateSource, generatePrompt, generatePrompts, fetchPromptAnswerAsync, fetchPromptAnswersAsync, getFilePaths, getFileNames } from '../shared/utils.js';
import * as prompts from '../shared/prompts.js';
import { firstStatementPrompt, subsequentStatementPrompt, firstExpressionPrompt, classificationPrompt, functionPrompt, subsequentExpressionPrompt } from '../shared/prompts.js';

const app = express();
const port = 3001;

const inputDirectory = 'data';
const referenceDirectory = 'data/references';
const temporaryDirectory = 'public/cache';
const outputDirectory = 'public';

let operations = {};

// START-UP Fetch available reference
const referenceCollections = [];
for (let referenceFilePath of getFilePaths(referenceDirectory)) {
    const referenceFileContent = fs.readFileSync(referenceFilePath, 'utf-8');
    const referenceFileCollection = JSON.parse(referenceFileContent);

    referenceCollections.push(referenceFileCollection);
}

// Enables CORS for all origins
// See https://expressjs.com/en/resources/middleware/cors.html
app.use(cors())

// Enables JSON parsing on body
app.use(express.json())

// Creates a new explanation
// app.post('/explanation/', (req, res) => {
//     const newExplanation = req.body;
//     explanations.push(newExplanation);
//     return res.status(201).send(newExplanation);
// });

// Fetches a specific explanation
app.post('/breakdown-code', (req, res) => {
    try {
        const code = req.body.code;
        const codeSnippets = breakdownCode(code);
        const explanation = { code, codeSnippets };
        return res.status(200).send(explanation);
    }
    catch (error) {
        return res.status(400).send({ error: error.message });
    }
});

app.get('/explanation/:id', (req, res) => {
    const explanation = getExplanation(req);
    if (!explanation)
        return res.status(404).send({ error: 'Explanation not found' });

    return res.status(200).send(explanation);
});

app.put('/explanation/:id', (req, res) => {
    const explanation = getExplanation(req);
    if (!explanation)
        return res.status(404).send({ error: 'Explanation not found' });

    for(const key in req.body) {
        explanation[key] = req.body[key];
    }

    saveExplanation(req, explanation);

    return res.status(200).send({ message: 'Explanation updated successfully' });
});

app.post('/explanation/:id/breakdown-code', (req, res) => {
    const explanation = getExplanation(req);
    if (!explanation)
        return res.status(404).send({ error: 'Explanation not found' });

    const { code } = explanation;
    if (!code)
        return res.status(400).send({ error: 'Explaination is missing code' });

    // TODO Extract code snippets to seperate module
    explanation.codeSnippets = breakdownCode(code);
    
    saveExplanation(req, explanation);

    return res.status(200).send(explanation);
});

app.post('/explanation/:id/explain-code', async (req, res) => {
    const explanation = getExplanation(req);
    if (!explanation)
        return res.status(404).send({ error: 'Explanation not found' });

    explanation.codeComments = [];

    // Function prompts 
    for(let snippet of explanation.codeSnippets.filter(s => s.type === "function")) {
        const source = snippet.code ?? explanation.code.slice(snippet.start, snippet.end);
        const prompt = generatePrompt(functionPrompt, source)
        const promptAnswer = await fetchPromptAnswerAsync(process.env.OPENAI_API_MODEL_LARGE, prompt);
        explanation.codeComments.push({ type: "function", start: snippet.start, end: snippet.end, description: promptAnswer });
    }

    // Statement prompts
    const statements = explanation.codeSnippets.filter(s => s.type === "statement");
    const statementsAsStrings = statements.map(s => s.code ?? explanation.code.slice(s.start, s.end));
    const statementsAsPrompts = generatePrompts(firstStatementPrompt, subsequentStatementPrompt, statementsAsStrings);
    const statementsAsPromptAnswers = await fetchPromptAnswersAsync(process.env.OPENAI_API_MODEL_LARGE, statementsAsPrompts);
    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];

        explanation.codeComments.push({
            type: "statement",
            start: statement.start,
            end: statement.end,
            description: statementsAsPromptAnswers[i]
        });
    }

    // Expression prompts
    const expressionGroups = explanation.codeSnippets.filter(s => s.type === "expression-group");
    for (let expressionGroup of expressionGroups) {
        const expressionsAsPrompts = expressionGroup.expressions.map(e => e.code ?? explanation.code.slice(e.start, e.end));
        const prompts = generatePrompts(firstExpressionPrompt, subsequentExpressionPrompt, expressionsAsPrompts);
        const promptAnswers = await fetchPromptAnswersAsync(process.env.OPENAI_API_MODEL_LARGE, prompts);
        
        for (let i = 0; i < expressionGroup.expressions.length; i++) {
            explanation.codeComments.push({
                type: "expression",
                start: expressionGroup.start,
                end: expressionGroup.end,
                description: promptAnswers[i]
            });
        }
    }

    saveExplanation(req, explanation);

    return res.status(200).send(explanation);
});

app.post('/explanation/:id/reference-code', async (req, res) => {
    const explanation = getExplanation(req);
    if (!explanation)
        return res.status(404).send({ error: 'Explanation not found' });

    explanation.codeReferences = [];

    for (let snippet of explanation.codeSnippets.filter(s => s.type === "statement")) {
        const referenceGroup = {
            type: "reference-group",
            start: snippet.start,
            end: snippet.end,
            references: []
        }

        for (let referenceCollection of referenceCollections) {
            const statementSource = snippet.code ?? explanation.code.slice(snippet.start, snippet.end);
            const referenceList = referenceCollection.map(s => s.text.trim()).join(", ");
            const prompt = classificationPrompt.replace("{0}", statementSource).replace("{1}", referenceList);
            const promptAnswer = await fetchPromptAnswerAsync(process.env.OPENAI_API_MODEL_SMALL, prompt);

            for (let reference of referenceCollection) {
                const referenceText = reference.text.trim();
                if (promptAnswer.includes(referenceText)) {
                    referenceGroup.references.push({
                        type: "reference",
                        text: reference.text,
                        link: reference.link
                    });
                }
            }
        }

        if (referenceGroup.references.length > 0)
            explanation.codeReferences.push(referenceGroup);
    }
    saveExplanation(req, explanation);

    return res.status(200).send(explanation);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);

    console.log('Available routes:');
    app._router.stack.forEach(function(r){
        if (r.route && r.route.path){
          console.log(r.route.path)
        }
      })
});

const generateId = function(){
    return "id" + Math.random().toString(16).slice(2);
}

function getExplanation(request) {
    const { id } = request.params;

    const explanationFilePath = outputDirectory + '/' + id + '.json';
    if (fs.existsSync(explanationFilePath)) {
        // Load explanation from file
        const fileContent = fs.readFileSync(explanationFilePath, 'utf-8');
        return JSON.parse(fileContent);
    }
    else {
        // Create explanation from code file
        const codeFilePath = inputDirectory + '/' + id + '.js';
        if (!fs.existsSync(codeFilePath))
            throw new Error('Code file not found');
        const code = fs.readFileSync(codeFilePath, 'utf-8');
        
        // Save explanation to file
        const explanation = { id, code };
        fs.writeFileSync(explanationFilePath, JSON.stringify(explanation, null, 2));

        return explanation;
    }
}

function saveExplanation(request, explanation) {
    const { id } = request.params;
    const explanationFilePath = outputDirectory + '/' + id + '.json';
    fs.writeFileSync(explanationFilePath, JSON.stringify(explanation, null, 2));
}

function getPrompts() {
    return prompts;
}

// Returns code snippets for a given code
function breakdownCode(code) { 
    const syntaxTree = parse(code, { ecmaVersion: "latest" });
    const functions = extractFunctionDeclarations(syntaxTree);
    const statements = extractStatements(compoundSyntaxNodes, syntaxTree);

    const functionSnippets = functions.map(node => ({ 
        id: generateId(), 
        type: "function", 
        start: node.start, 
        end: node.end 
    }));
    const statementSnippets = statements.map(node => ({ 
        id: generateId(), 
        type: "statement", 
        start: node.start, 
        end: node.end 
    }));
    const expressionGroupSnippets = statements.map(s => {
        const expressions = [...extractExpressions(memberSyntaxNodes, s), s];
        return {
            id: generateId(),
            type: "expression-group",
            start: s.start,
            end: s.end,
            expressions: expressions.map((n, i) => ({ order: i, start: n.start, end: n.end }))
        }
    }).filter(e => e.expressions.length > 2);

    return [...functionSnippets, ...statementSnippets, ...expressionGroupSnippets];
}

function startExplaninationTask(operationId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Mark operation as complete after the delay
            operations[operationId].status = 'completed';
            resolve();
        }, 10000); // 10 seconds delay to simulate long operation
    });
};

function startReferenceTask(operationId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Mark operation as complete after the delay
            operations[operationId].status = 'completed';
            resolve();
        }, 10000); // 10 seconds delay to simulate long operation
    });
}

function getTaskStatus(operationId) {
    return operations[operationId];
}