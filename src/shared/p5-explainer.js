import { fetchPromptAnswerAsync, fetchPromptAnswersAsync, generatePrompt, generatePrompts } from "./utils.js";

export const defaultPrompts = {
    functionPrompt: `
    Du er en programmerings underviser på et kode kursus for ikke-tekniske universitetsstuderende uden programmeringserfaring. Du skal beskrive funktionen af nedenstående funktion i en sætning begynde med funktions navnet, f.eks. setup() opretter... 
    {0}`.trim(),

    firstStatementPrompt: `
    Du er en programmerings underviser på et kode kursus for ikke-tekniske universitetsstuderende uden programmeringserfaring. Du skal beskrive enkelt statements til en guide omkring p5.js. Beskrivelserne skal følge formen: 
    
    createButton(...) fortæller p5.js, at den skal indsætte en ny knap.  
    
    let helloWorldButton = createButton(...) fortæller p5.js, at en reference til den oprette knap skal gemmes i variablen helloWorldButton.
    
    helloWorldButton.mousePressed(sayHelloWorld) fortæller p5.js, at den skal køre funktionen sayHelloWorld når der trykkes på knappen referet til i helloWorldButton variablen.
    
    console.log(textValue); fortæller p5.js, at den skal skrive den nuværende værdi af textValue til loggen. 
    
    Beskriv: {0}
    `.trim(),

    subsequentStatementPrompt: `Beskriv: {0}`.trim(),

    firstExpressionPrompt: `
    Du er en programmerings underviser på et kode kursus for ikke-tekniske universitetsstuderende uden programmeringserfaring. Du skal beskrive hver enkelt expression fra et statement fra til en guide omkring p5.js. Du vil få en expression ad gangen, som skal beskrives kort og præcist uden gentagelser. Færdiggør nedenståede sætning: {0} betyder, at
    `.trim(),

    subsequentExpressionPrompt: `Færdiggør nedenståede sætning: {0} betyder, at `.trim()
};

export function createExplainAsync(options) {
    return async (code, codeSnippets) => {
        const codeComments = [];

        // Function prompts 
        for(let snippet of codeSnippets.filter(s => s.type === "function")) {
            const source = snippet.code ?? code.slice(snippet.start, snippet.end);
            const prompt = generatePrompt(defaultPrompts.functionPrompt, source)
            const promptAnswer = await fetchPromptAnswerAsync(process.env.OPENAI_API_MODEL_LARGE, prompt);
            codeComments.push({ type: "function", start: snippet.start, end: snippet.end, description: promptAnswer });
        }
    
        // Statement prompts
        const statements = codeSnippets.filter(s => s.type === "statement");
        const statementsAsStrings = statements.map(s => s.code ?? code.slice(s.start, s.end));
        const statementsAsPrompts = generatePrompts(defaultPrompts.firstStatementPrompt, defaultPrompts.subsequentStatementPrompt, statementsAsStrings);
        const statementsAsPromptAnswers = await fetchPromptAnswersAsync(process.env.OPENAI_API_MODEL_LARGE, statementsAsPrompts);
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
    
            codeComments.push({
                type: "statement",
                start: statement.start,
                end: statement.end,
                description: statementsAsPromptAnswers[i]
            });
        }
    
        // Expression prompts
        const expressionGroups = codeSnippets.filter(s => s.type === "expression-group");
        for (let expressionGroup of expressionGroups) {
            const expressionsAsPrompts = expressionGroup.expressions.map(e => e.code ?? code.slice(e.start, e.end));
            const prompts = generatePrompts(defaultPrompts.firstExpressionPrompt, defaultPrompts.subsequentExpressionPrompt, expressionsAsPrompts);
            const promptAnswers = await fetchPromptAnswersAsync(process.env.OPENAI_API_MODEL_LARGE, prompts);
            
            for (let i = 0; i < expressionGroup.expressions.length; i++) {
                codeComments.push({
                    type: "expression",
                    start: expressionGroup.start,
                    end: expressionGroup.end,
                    description: promptAnswers[i]
                });
            }
        }

        return codeComments;
    };
}

export function getExplainer(options) {
    return { 
        explainAsync: createExplainAsync(options)
    }
}
