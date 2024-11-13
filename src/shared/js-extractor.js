
import { parse } from "acorn";
import * as walk from 'acorn-walk';
import { generateId } from './utils.js';

function createSnippet(type, node) {
    return {
        id: generateId(),
        type,
        start: node.start,
        end: node.end
    };
}

export function extractFunctionDeclarations(syntaxTree) {
    const functionDeclarations = [];

    walk.simple(syntaxTree, {
        FunctionDeclaration(node) {
            functionDeclarations.push(node);
        }
    });

    return functionDeclarations;
}

// Extracts relevant "statement" nodes from the syntax tree
export function extractStatmentNodes(syntaxTree) {
    const compoundSyntaxNodes = [
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
        'ClassDeclaration',
    ];

    const buffer = [];
    walk.ancestor(syntaxTree, {
        Statement(node, ancestors) {
            // Skips compound statements
            if (!compoundSyntaxNodes.includes(node.type)) {
                node.ancestors = [...ancestors];
                buffer.push(node);
            }

            // Includes condition of if, while, do while statements
            if (['IfStatement', 'WhileStatement', 'DoWhileStatement'].includes(node.type)) {
                node.test.ancestors = [...ancestors, node];
                buffer.push(node.test);
            }

            if (node.type == "SwitchStatement") {
                node.discriminant.ancestors = [...ancestors, node];
                buffer.push(node.discriminant);
            }

            // Includes init, condition and update of for statements
            if (node.type == "ForStatement") {
                let subNodeAncestors = [...ancestors, node];

                node.init.ancestors = subNodeAncestors;
                node.test.ancestors = subNodeAncestors;
                node.update.ancestors = subNodeAncestors;

                buffer.push(node.init, node.test, node.update);
            }
        }
    });
    return buffer;
}

export function extractStatementSnippets(code, nodes) {
    const snippets = [];

    for(let node of nodes) {
        let containingFunction = node.ancestors.find(a => a.type === "FunctionDeclaration");
        
        if (containingFunction) {
            let statementGroup = snippets.find(s => s.type === "statement-group" && s.start === containingFunction.start && s.end === containingFunction.end);

            // Create statement group if it doesn't exist
            if (!statementGroup) {
                // Reduces function code to preserve function signature, ex. function test() { ... }
                let reducedFunctionCode = [
                    code.substring(containingFunction.start, containingFunction.body.start),
                    "{ ... }",
                    code.substring(containingFunction.body.end, containingFunction.end)
                ].join(""); 

                // Creates a statement group for the function
                statementGroup = {
                    id: generateId(),
                    type: "statement-group",
                    start: containingFunction.start,
                    end: containingFunction.end,
                    code: reducedFunctionCode,
                    statements: []
                }
                snippets.push(statementGroup);
            }

            // Add statement to the group
            statementGroup.statements.push(createSnippet('statement', node));            
        }
        else {
            // Global statement
            snippets.push(createSnippet('statement', node));
        }
    }
    return snippets;
}

export function extractExpressionSnippets(node) {
    const memberSyntaxNodes = [
        'Identifier',
        'MemberExpression',
        'Literal'
    ];

    const expressions = [];

    walk.simple(node, {
        Expression(node) {
            if (!memberSyntaxNodes.includes(node.type))
                expressions.push(node);
        }
    });

    if (node.type !== 'ExpressionStatement')
        expressions.push(node);

    return expressions;
}

export function createParse(options) {
    return (code) => {
        let syntaxTree = parse(code, {
            ecmaVersion: "latest",
            ...options,
        });
        return { code, syntaxTree };
    };
}

export function createExtract(options) {
    return ({code, syntaxTree}) => {
        let statementNodes = extractStatmentNodes(syntaxTree);
        
        const functions = extractFunctionDeclarations(syntaxTree);
        const statementSnippets = extractStatementSnippets(code, statementNodes);

        const functionSnippets = functions.map(node => ({
            id: generateId(),
            type: "function",
            start: node.start,
            end: node.end
        }));
        const expressionGroupSnippets = statementNodes.map(s => {
            const expressions = extractExpressionSnippets(s);
            return {
                id: generateId(),
                type: "expression-group",
                start: s.start,
                end: s.end,
                expressions: expressions.map((n, i) => ({ order: i, start: n.start, end: n.end }))
            }
        }).filter(e => e.expressions.length > 2);

        return [...functionSnippets, ...statementSnippets, ...expressionGroupSnippets];
    };
}

/***
 * Extractor generator 
 * @returns {Object} Extractor
 * @returns {Function} Extractor.parse - Parse the source code and throws an error if the source code is invalid
 * @returns {Function} Extractor.extract - Extract the relevant information from the source code
 */
export function getExtractor(options) {
    return {
        parse: createParse(options),
        extract: createExtract(options),
    }
}