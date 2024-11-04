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
    .argument('<fileGlob>', 'file glob to read files')
    .option('--skip-comments', 'skip processing comments')
    .option('--skip-references', 'skip processing references')
    .option('--skip-index', 'skip generating index file')
    .option('--skip-all', 'skip all processing')
    .action(async (fileGlob, options) => {
        const files = glob.sync(fileGlob).map(filePath => {
            const relativeFilePath = path.relative(process.cwd(), filePath).replace(/[\/\\]/g, '-');
            const outputFilePath = path.join(outputDirectory, relativeFilePath).replace(/\.js$/, '.json');

            return {
                input: filePath,
                output: outputFilePath
            }
        });

        for (let file of files) {
            const code = fs.readFileSync(file.input, 'utf-8');
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
            const indexFilePath = path.join(outputDirectory, 'index.json');
            const indexFileContent = JSON.stringify(files.map(f => f.output), null, 2);
            fs.mkdirSync(path.dirname(indexFilePath), { recursive: true });
            fs.writeFileSync(indexFilePath, indexFileContent);
        }
    });

program.parse(process.argv);