import * as walk from 'acorn-walk';

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