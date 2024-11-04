import { fetchPromptAnswerAsync } from "./utils.js";

export const defaultPrompts = {
    classificationPrompt: `
    Classify the used syntax in the following code sample: 
    {0}
    
    Valid classifications:
    {1}
    
    Write only the classification names and most relevant classifications
    `.trim()
};

export function createGenerateReferencesAsync(options) {
    return async (code, codeSnippets) => {
        const codeReferences = [];

        for(let snippet of codeSnippets) {
            const referenceGroup = {
                type: "reference-group",
                start: snippet.start,
                end: snippet.end,
                references: []
            }
    
            for (let referenceCollection of options.referenceCollections) {
                const statementSource = snippet.code ?? code.slice(snippet.start, snippet.end);
                const referenceList = referenceCollection.map(s => s.text.trim()).join(", ");
                const prompt = defaultPrompts.classificationPrompt.replace("{0}", statementSource).replace("{1}", referenceList);
                const promptAnswer = await fetchPromptAnswerAsync(process.env.OPENAI_API_MODEL_SMALL, prompt);
    
                for (let reference of referenceCollection) {
                    const referenceText = reference.text.trim();
                    if (promptAnswer.includes(referenceText)) {
                        referenceGroup.references.push({
                            type: "reference",
                            text: reference.text,
                            link: reference.link
                        });
                    }
                }
            }
    
            if (referenceGroup.references.length > 0)
                codeReferences.push(referenceGroup);
        }
        return codeReferences;
    }
}

export function getReferer(options) {
    return {
        generateReferencesAsync: createGenerateReferencesAsync(options)
    }
}