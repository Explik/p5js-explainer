import { expect } from "chai";
import { extractStatmentNodes, extractExpressionSnippets, createParse } from "./js-extractor.js";

describe('internal functions', () => {
    let parse = createParse();
    let stringify = (code, snippets) => snippets.map(s => s.code ? s.code : code.substring(s.start, s.end));


    describe('extract statements function', () => {
        it('should return statements in code', () => {
            const code = `let a = 5; let b = 10; console.log(a + b);`;
            const { syntaxTree } = parse(code);
            const statements = extractStatmentNodes(syntaxTree);
            const statementAsCode = stringify(code, statements);

            expect(statementAsCode).to.have.length(3);
            expect(statementAsCode).to.include('let a = 5;');
            expect(statementAsCode).to.include('let b = 10;');
            expect(statementAsCode).to.include('console.log(a + b);');
        });

        it('should return statements from function', () => {
            const code = `
                function test() {
                    let a = 5; 
                    console.log(a * a);
                }
            `;

            const { syntaxTree } = parse(code);
            const statements = extractStatmentNodes(syntaxTree);
            const statementAsCode = stringify(code, statements);

            expect(statementAsCode).to.have.length(2);
            expect(statementAsCode).to.include('let a = 5;');
            expect(statementAsCode).to.include('console.log(a * a);');
        });

        it('should return condition and body for if statement without block', () => {
            const code = `
                if (5 == 6) 
                    console.log('5 is equal to 6');
            `;

            const { syntaxTree } = parse(code);
            const statements = extractStatmentNodes(syntaxTree);
            const statementAsCode = stringify(code, statements);

            expect(statementAsCode).to.have.length(2);
            expect(statementAsCode).to.include('5 == 6');
            expect(statementAsCode).to.include("console.log('5 is equal to 6');");
        });

        it('should return condition and body for if statement with block', () => {
            const code = `
                if (5 == 6) {
                    console.log('5 is equal to 6');
                }
            `;

            const { syntaxTree } = parse(code);
            const statements = extractStatmentNodes(syntaxTree);
            const statementAsCode = stringify(code, statements);

            expect(statementAsCode).to.have.length(2);
            expect(statementAsCode).to.include('5 == 6');
            expect(statementAsCode).to.include("console.log('5 is equal to 6');");
        });

        it('should return conditions and bodies for if else chain', () => {
            const code = `
                if (5 == 6) {
                    console.log('5 is equal to 6');
                }
                else if (5 == 5) {
                    console.log('5 is equal to 5');
                }
                else {
                    console.log('5 is not equal to 5 or 6');
                }
            `;
            const { syntaxTree } = parse(code);
            const statements = extractStatmentNodes(syntaxTree);
            const statementAsCode = stringify(code, statements);

            expect(statementAsCode).to.have.length(5);
            expect(statementAsCode).to.include('5 == 6');
            expect(statementAsCode).to.include("console.log('5 is equal to 6');");
            expect(statementAsCode).to.include('5 == 5');
            expect(statementAsCode).to.include("console.log('5 is equal to 5');");
            expect(statementAsCode).to.include("console.log('5 is not equal to 5 or 6');");
        });
    });

    describe('extract expression function', () => {
        it('should return statement and sub expressions from declaration', () => {
            const code = `let a = 5 + 10;`;
            const { syntaxTree } = parse(code);
            const statement = extractStatmentNodes(syntaxTree)[0];
            const expressions = extractExpressionSnippets(statement);
            const expressionAsCode = stringify(code, expressions);

            expect(expressionAsCode).to.have.length(2);
            expect(expressionAsCode[0]).to.equal('5 + 10');
            expect(expressionAsCode[1]).to.equal('let a = 5 + 10;');
        });

        it('should return only expressions from expression statement', () => {
            const code = `5 + 10;`;
            const { syntaxTree } = parse(code);
            const statement = extractStatmentNodes(syntaxTree)[0];
            const expressions = extractExpressionSnippets(statement);
            const expressionAsCode = stringify(code, expressions);

            expect(expressionAsCode).to.have.length(1);
            expect(expressionAsCode).to.include('5 + 10');
        });

        it('should skip literal expression', () => {
            const code = `let b = 5 + 10;`;
            const { syntaxTree } = parse(code);
            const statement = extractStatmentNodes(syntaxTree)[0];
            const expressions = extractExpressionSnippets(statement);
            const expressionAsCode = stringify(code, expressions);

            expect(expressionAsCode).to.have.length(2);
            expect(expressionAsCode[0]).to.equal('5 + 10');
            expect(expressionAsCode[1]).to.equal('let b = 5 + 10;');
        });

        it ('should skip variable identifier', () => {
            const code = `let b = a + 10;`;
            const { syntaxTree } = parse(code);
            const statement = extractStatmentNodes(syntaxTree)[0];
            const expressions = extractExpressionSnippets(statement);
            const expressionAsCode = stringify(code, expressions);

            expect(expressionAsCode).to.have.length(2);
            expect(expressionAsCode[0]).to.equal('a + 10');
            expect(expressionAsCode[1]).to.equal('let b = a + 10;');
        });

        it('should skip member expression', () => {
            const code = `let b = a.m + 10;`;
            const { syntaxTree } = parse(code);
            const statement = extractStatmentNodes(syntaxTree)[0];
            const expressions = extractExpressionSnippets(statement);
            const expressionAsCode = stringify(code, expressions);

            expect(expressionAsCode).to.have.length(2);
            expect(expressionAsCode[0]).to.equal('a.m + 10');
            expect(expressionAsCode[1]).to.equal('let b = a.m + 10;');
        });

        it ('should skip function names in call expressions', () => {
            const code = `f() + 10;`;
            const { syntaxTree } = parse(code);
            const statement = extractStatmentNodes(syntaxTree)[0];
            const expressions = extractExpressionSnippets(statement);
            const expressionAsCode = stringify(code, expressions);

            expect(expressionAsCode).to.have.length(2);
            expect(expressionAsCode[0]).to.equal('f()');
            expect(expressionAsCode[1]).to.equal('f() + 10');
        });
    });
});