import OpenAI from "openai";

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