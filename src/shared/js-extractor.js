
import { parse } from "acorn";
import * as walk from 'acorn-walk';
import { generateId } from './utils.js';

export function extractFunctionDeclarations(syntaxTree) {
    const functionDeclarations = [];

    walk.simple(syntaxTree, {
        FunctionDeclaration(node) {
            functionDeclarations.push(node);
        }
    });

    return functionDeclarations;
}

export function extractStatements(syntaxTree) {
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
    ];

    const allStatements = [];

    walk.ancestor(syntaxTree, {
        Statement(node) {
            // Skips compound statements
            if (!compoundSyntaxNodes.includes(node.type))
                allStatements.push(node);

            // Includes condition of if statements
            if (node.type === 'IfStatement')
                allStatements.push(node.test);
        }
    });

    return allStatements;
}

export function extractExpressions(node) {
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
    return (code) => parse(code, {
        ecmaVersion: "latest",
        ...options,
    });
}

export function createExtract(options) {
    return (syntaxTree) => {
        const functions = extractFunctionDeclarations(syntaxTree);
        const statements = extractStatements(syntaxTree);

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
            const expressions = extractExpressions(s);
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