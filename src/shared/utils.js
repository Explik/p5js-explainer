import fs from 'fs';
import path from 'path';
import OpenAI from "openai";
import * as walk from 'acorn-walk';


export function generatePrompt(prompt, placeholders) {
    if (!Array.isArray(placeholders))
        placeholders = [placeholders];

    let newPrompt = prompt;
    for(let i = 0; i < placeholders.length; i++) {
        newPrompt = newPrompt.replace("{" + i + "}", placeholders[i]);
    }
    return newPrompt;
}

export function generatePrompts(firstPrompt, subsequentPrompt, placeholders) {
    return placeholders.map((placeholder, index) => {
        if (index === 0) {
            return firstPrompt.replace('{0}', placeholder);
        } else {
            return subsequentPrompt.replace('{0}', placeholder);
        }
    });
}

export async function fetchPromptAnswerAsync(model, prompt) {
    const promptAnswers = await fetchPromptAnswersAsync(model, [prompt]);
    return promptAnswers[0];
}

export async function fetchPromptAnswersAsync(model, prompts) {
    const messages = []; // Initialize conversation messages array
    const responses = []; // Array to hold all responses
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    for (const prompt of prompts) {
        // Add user's message to the conversation history
        messages.push({ role: "user", content: prompt });

        try {
            const response = await openai.chat.completions.create({
                model: model,
                messages: messages,
                temperature: 1,
                max_tokens: 2048,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
                response_format: {
                  "type": "text"
                },
              });

            // Add the assistant's response to the conversation history
            const answer = response.choices[0].message.content;            
            messages.push({ role: "assistant", content: answer });
            responses.push(answer);

        } catch (error) {
            console.error(`Error fetching response for prompt: "${prompt}"`, error.message);
            responses.push(null); // Push null for the response if an error occurs
        }
    }

    return responses; // Return the array of responses
}

export function getFilePaths(directory) {
    return getFileNames(directory).map(f => path.join(directory, f));
}

export function getFileNames(directory) {
    return fs.readdirSync(directory, { withFileTypes: true })
        .filter(d => d.isFile())
        .map(d => d.name);
}

export async function generateFileIfNonExistentAsync(filePath, contentCallback) {
    if (typeof filePath !== 'string')
        throw new Error('filePath must be a string');
    if (typeof contentCallback !== 'function')
        throw new Error('contentCallback must be a function');

    if (!fs.existsSync(filePath)) {
        const content = await contentCallback();
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content);
    }
}

export const compoundSyntaxNodes = [
    'BlockStatement', 
    'IfStatement', 
    'SwitchStatement',
    'ForStatement',
    'ForInStatement',
    'ForOfStatement',
    'WhileStatement',
    'DoWhileStatement',
    'TryStatement',
    'CatchClause',
    'FunctionDeclaration',
    'FunctionExpression',
];

export const memberSyntaxNodes = [
    'Identifier',
    'MemberExpression',
    'Literal'
]

export function extractFunctionDeclarations(syntaxTree) {
    const functionDeclarations = [];

    walk.simple(syntaxTree, {
        FunctionDeclaration(node) {
            functionDeclarations.push(node);
        }
    });

    return functionDeclarations;
}

export function extractStatements(excludedNodeTypes, syntaxTree) {
    const allStatements = [];

    walk.ancestor(syntaxTree, {
        Statement(node) {
            if(!excludedNodeTypes.includes(node.type))
                allStatements.push(node);
        }
    });

    return allStatements;
}

export function extractExpressions(excludedNodeTypes, node) {
    const expressions = [];

    walk.simple(node, {
        Expression(node) {
            if (!excludedNodeTypes.includes(node.type))
                expressions.push(node);
        }
    });

    return expressions;
}

export function generateSource(source, syntaxNode) {
    return source.substring(syntaxNode.start, syntaxNode.end);
}