import fs from 'fs';
import cors from 'cors';
import express from 'express';
import { getFilePaths } from '../shared/utils.js';
import { getReferer } from '../shared/generic-referer.js';
import { getExtractor } from '../shared/js-extractor.js';
import { getExplainer } from '../shared/p5-explainer.js';

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

const extractor = getExtractor();
const explainer = getExplainer();
const referer = getReferer({ referenceCollections });

// Enables CORS for all origins
// See https://expressjs.com/en/resources/middleware/cors.html
app.use(cors())

// Enables JSON parsing on body
app.use(express.json())

// Creates snippets from code
app.post('/breakdown-code', (req, res) => {
    try {
        const { code } = req.body;
        if (!code) 
            return res.status(400).send({ error: 'Code is missing' });

        const syntaxTree = extractor.parse(code);
        const codeSnippets = extractor.extract(syntaxTree);
        return res.status(200).send({ ...req.body, codeSnippets });
    }
    catch (error) {
        return res.status(400).send({ error: error.message });
    }
});

// Creates comments from code snippets
app.post('/explain-code', async (req, res) => {
    const { code, codeSnippets } = req.body;
    if (!code) 
        return res.status(400).send({ error: 'Code is missing' });
    if (!codeSnippets)
        return res.status(400).send({ error: 'Code snippets is missing' });

    const codeComments = await explainer.explainAsync(code, codeSnippets);
    return res.status(200).send({ ...req.body, codeComments });
});

// Creates references from code snippets
app.post('/reference-code', async (req, res) => {
    const { code, codeSnippets } = req.body;
    if (!code) 
        return res.status(400).send({ error: 'Code is missing' });
    if (!codeSnippets)
        return res.status(400).send({ error: 'Code snippets is missing' });

    const codeReferences = await referer.generateReferencesAsync(code, codeSnippets);
    return res.status(200).send({ ...req.body, codeReferences });
});

// Creates a new explanation
// app.post('/explanation/', (req, res) => {
//     const newExplanation = req.body;
//     explanations.push(newExplanation);
//     return res.status(201).send(newExplanation);
// });

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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);

    console.log('Available routes:');
    app._router.stack.forEach(function(r){
        if (r.route && r.route.path){
          console.log(r.route.path)
        }
      })
});

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

        try {
            explanation.codeSnippets = extactor.extract(extractor.parse(code));
        }
        catch (error) { /* Ignore any errors */ }

        fs.writeFileSync(explanationFilePath, JSON.stringify(explanation, null, 2));

        return explanation;
    }
}

function saveExplanation(request, explanation) {
    const { id } = request.params;
    const explanationFilePath = outputDirectory + '/' + id + '.json';
    fs.writeFileSync(explanationFilePath, JSON.stringify(explanation, null, 2));
}