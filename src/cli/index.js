import crypto from 'crypto';
import fs from 'fs'; 
import path from 'path';
import { parse } from 'acorn';
import { Command } from 'commander';
import { glob } from 'glob';
import { getReferer } from '../shared/generic-referer.js';
import { getExtractor } from '../shared/js-extractor.js';
import { getExplainer } from '../shared/p5-explainer.js';
import { getFilePaths } from '../shared/utils.js';

// START-UP Fetch available reference
const outputDirectory = 'public';
const referenceDirectory = 'data/references';

fs.mkdirSync(outputDirectory, { recursive: true });

const referenceCollections = [];
for (let referenceFilePath of getFilePaths(referenceDirectory)) {
    const referenceFileContent = fs.readFileSync(referenceFilePath, 'utf-8');
    const referenceFileCollection = JSON.parse(referenceFileContent);

    referenceCollections.push(referenceFileCollection);
}

const extractor = getExtractor();
const explainer = getExplainer();
const referer = getReferer({ referenceCollections }); 

// Register commands for the CLI
const program = new Command();
program
    .command('generate')
    .argument('<fileGlob>', 'file glob to read files')
    .option('--reprocess', 'reprocess existing files (even if they have not changed)')
    .option('--skip-comments', 'skip processing comments')
    .option('--skip-references', 'skip processing references')
    .option('--skip-index', 'skip generating index file')
    .option('--skip-all', 'skip all processing')
    .action(async (fileGlob, options) => {
        const files = getFiles(fileGlob);

        for (let file of files) {
            let code = fs.readFileSync(file.input, 'utf-8');
            let explanation = fs.existsSync(file.output, 'utf-8') ? JSON.parse(fs.readFileSync(file.output, 'utf-8')) : undefined;
            
            // Checks if the code file has changed, so it can be skipped if it hasn't
            if (explanation && !options.reprocess) {
                if (explanation.code === code) {
                    console.log(`Skipping ${file.input}, no changes detected.`);
                    continue;
                }
            }

            console.log(`Processing ${file.input}...`);

            // Generates code snippets, comments and references if not skipped
            const syntaxTree = extractor.parse(code);

            const buffer = {
                code,
                codeSnippets: extractor.extract(syntaxTree)
            };

            if (!options.skipComments && !options.skipAll) {
                buffer.codeComments = await explainer.explainAsync(buffer.code, buffer.codeSnippets);
            }

            if (!options.skipReferences && !options.skipAll) {
                buffer.codeReferences = await referer.generateReferencesAsync(buffer.code, buffer.codeSnippets);
            }

            fs.mkdirSync(path.dirname(file.output), { recursive: true });
            fs.writeFileSync(file.output, JSON.stringify(buffer, null, 2));
        }

        if (!options.skipIndex && !options.skipAll) {
            createIndexFile(files);
        }
    });

program
    .command('generate-comments')
    .argument('<fileGlob>', 'file glob to read files')
    .option('--reprocess', 'reprocess existing files (even if they have not changed)')
    .action(async (fileGlob, options) => {
        const files = getFiles(fileGlob);

        for (let file of files) {
            const code = fs.readFileSync(file.input, 'utf-8');
            const explanation = fs.existsSync(file.output, 'utf-8') ? JSON.parse(fs.readFileSync(file.output, 'utf-8')) : undefined;
            
            // Skips processing if the code file has not changed
            if (explanation && !options.reprocess) {
                if (explanation.code === code) {
                    console.log(`Skipping ${file.input}, no changes detected.`);
                    continue;
                }
            }

            console.log(`Processing ${file.input}...`);

            // Extracts code references from existing file or generate new ones
            let buffer; 
            let useExistingExplanation = explanation?.code == code && explanation?.codeSnippets;
            if (!useExistingExplanation) {
                let codeSnippets = extractor.extract(extractor.parse(code));
                let codeComments = await explainer.explainAsync(code, codeSnippets);

                buffer = { code, codeSnippets, codeComments };
            }
            else {
                let codeComments = await explainer.explainAsync(explanation.code, explanation.codeSnippets);
                buffer = {
                    ...explanation,
                    codeComments
                };
            }

            fs.mkdirSync(path.dirname(file.output), { recursive: true });
            fs.writeFileSync(file.output, JSON.stringify(buffer, null, 2));
        }
    });

program
    .command('generate-references')
    .argument('<fileGlob>', 'file glob to read files')
    .option('--reprocess', 'reprocess existing files (even if they have not changed)')
    .action(async (fileGlob, options) => {
        const files = getFiles(fileGlob);

        for (let file of files) {
            const code = fs.readFileSync(file.input, 'utf-8');
            const explanation = fs.existsSync(file.output, 'utf-8') ? JSON.parse(fs.readFileSync(file.output, 'utf-8')) : undefined;
            
            // Skips processing if the code file has not changed
            if (explanation && !options.reprocess) {
                if (explanation.code === code) {
                    console.log(`Skipping ${file.input}, no changes detected.`);
                    continue;
                }
            }

            console.log(`Processing ${file.input}...`);

            // Extracts code references from existing file or generate new ones
            let buffer; 
            let useExistingExplanation = explanation?.code == code && explanation?.codeSnippets;
            if (!useExistingExplanation) {
                let codeSnippets = extractor.extract(extractor.parse(code));
                let codeReferences = await referer.generateReferencesAsync(code, codeSnippets);

                buffer = { code, codeSnippets, codeReferences };
            }
            else {
                let codeReferences = await referer.generateReferencesAsync(explanation.code, explanation.codeSnippets);
                buffer = {
                    ...explanation,
                    codeReferences
                };
            }

            fs.mkdirSync(path.dirname(file.output), { recursive: true });
            fs.writeFileSync(file.output, JSON.stringify(buffer, null, 2));
        }
    });

program
    .command('generate-index')
    .argument('<fileGlob>', 'file glob to read files')
    .action((fileGlob) => {
        const files = getFiles(fileGlob);
        createIndexFile(files);
    });

program.parse(process.argv);

function getFiles(fileGlob) {
    return glob.sync(fileGlob).map(filePath => {
        const relativeFilePath = path.relative(process.cwd(), filePath).replace(/[\/\\]/g, '-');
        const url = relativeFilePath.replace(/\.js$/, '');
        const outputFilePath = path.join(outputDirectory, relativeFilePath).replace(/\.js$/, '.json');
        
        return {
            url: url,
            input: filePath,
            output: outputFilePath
        }
    });
}

function createIndexFile(files) {
    const indexFilePath = path.join(outputDirectory, 'index.json');
    const indexFileContent = JSON.stringify(generateIndexContent(files), null, 2);

    fs.mkdirSync(path.dirname(indexFilePath), { recursive: true });
    fs.writeFileSync(indexFilePath, indexFileContent);
}

function generateIndexContent(files) {
    const index = [];
    let lastIndex = 0; 

    files.forEach(file => {
        const parts = file.input.split(path.sep);
        let currentLevel = index;

        parts.forEach((part, index) => {
            const existingPath = currentLevel.find(item => item.name === part);

            if (existingPath) {
                currentLevel = existingPath.items;
            } else {
                const isFile = index === parts.length - 1;
                const newItem = {
                    id: lastIndex++,
                    type: isFile ? 'file' : 'directory',
                    name: part,
                    path: isFile ? file.url : undefined,
                    items: !isFile ? [] : undefined
                };

                currentLevel.unshift(newItem);
                currentLevel = newItem.items;
            }
        });
    });

    return index;
}
