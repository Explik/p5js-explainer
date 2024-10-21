import cors from 'cors';
import express from 'express';
import { parse } from 'acorn';
import { compoundSyntaxNodes, extractStatements } from '../shared/utils.js';

const app = express();
const port = 3001;

// Enables CORS for all origins
// See https://expressjs.com/en/resources/middleware/cors.html
app.use(cors())

// Enables JSON parsing on body
app.use(express.json())

app.post('/breakdown', (req, res) => {
    const { code } = req.body;
    if (!code)
        return res.status(400).send({ error: 'No code provided in the request body' });

    const syntaxTree = parse(code, { ecmaVersion: "latest" });
    const statements = extractStatements(compoundSyntaxNodes, syntaxTree);
    const statementRanges = statements.map(node => ({
        start: node.start,
        end: node.end
    }));

    return res.status(200).send(statementRanges);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});