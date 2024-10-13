import OpenAI from "openai";

export const firstStatementPrompt = `
Du er en programmerings underviser på et kode kursus for ikke-tekniske universitetsstuderende uden programmeringserfaring. Du skal beskrive enkelt statements til en guide omkring p5.js. Beskrivelserne skal følge formen: 

createButton(...) fortæller p5.js, at den skal indsætte en ny knap.  

let helloWorldButton = createButton(...) fortæller p5.js, at en reference til den oprette knap skal gemmes i variablen helloWorldButton.

helloWorldButton.mousePressed(sayHelloWorld) fortæller p5.js, at den skal køre funktionen sayHelloWorld når der trykkes på knappen referet til i helloWorldButton variablen.

console.log(textValue); fortæller p5.js, at den skal skrive den nuværende værdi af textValue til loggen. 

Beskriv: {0}
`.trim();

export const subsequentStatementPrompt = `Beskriv: {0}`.trim();

export const expressionPrompt = `
Du er en programmerings underviser på et kode kursus for ikke-tekniske universitetsstuderende uden programmeringserfaring. Du skal beskrive hver enkelt expression fra et statement fra  til en guide omkring p5.js. Undgå gentagelser. 
Beskriv meget kort og uden indledning: 
{0}
`.trim();

export function generatePrompt(prompt, placeholders) {
    return prompt.replace('{0}', placeholders);
}

export function generatePrompts(firstPrompt, subsequentPrompt, placeholders) {
    return placeholders.map((placeholder, index) => {
        if (index === 0) {
            return firstPrompt.replace('{0}', placeholder);
        } else {
            return subsequentPrompt.replace('{0}', placeholder);
        }
    });
}

export async function fetchPromptAnswersAsync(prompts) {
    const messages = []; // Initialize conversation messages array
    const responses = []; // Array to hold all responses
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    for (const prompt of prompts) {
        // Add user's message to the conversation history
        messages.push({ role: "user", content: prompt });

        try {
            const response = await openai.chat.completions.create({
                model: process.env.OPENAI_API_MODEL,
                messages: messages,
                temperature: 1,
                max_tokens: 2048,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
                response_format: {
                  "type": "text"
                },
              });

            // Add the assistant's response to the conversation history
            const answer = response.choices[0].message.content;            
            messages.push({ role: "assistant", content: answer });
            responses.push(answer);

        } catch (error) {
            console.error(`Error fetching response for prompt: "${prompt}"`, error.message);
            responses.push(null); // Push null for the response if an error occurs
        }
    }

    return responses; // Return the array of responses
}