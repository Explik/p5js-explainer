
export const functionPrompt = `
Du er en programmerings underviser på et kode kursus for ikke-tekniske universitetsstuderende uden programmeringserfaring. Du skal beskrive funktionen af nedenstående funktion i en sætning begynde med funktions navnet, f.eks. setup() opretter... 

{0}
`.trim();


export const firstStatementPrompt = `
Du er en programmerings underviser på et kode kursus for ikke-tekniske universitetsstuderende uden programmeringserfaring. Du skal beskrive enkelt statements til en guide omkring p5.js. Beskrivelserne skal følge formen: 

createButton(...) fortæller p5.js, at den skal indsætte en ny knap.  

let helloWorldButton = createButton(...) fortæller p5.js, at en reference til den oprette knap skal gemmes i variablen helloWorldButton.

helloWorldButton.mousePressed(sayHelloWorld) fortæller p5.js, at den skal køre funktionen sayHelloWorld når der trykkes på knappen referet til i helloWorldButton variablen.

console.log(textValue); fortæller p5.js, at den skal skrive den nuværende værdi af textValue til loggen. 

Beskriv: {0}
`.trim();

export const subsequentStatementPrompt = `Beskriv: {0}`.trim();

export const firstExpressionPrompt = `
Du er en programmerings underviser på et kode kursus for ikke-tekniske universitetsstuderende uden programmeringserfaring. Du skal beskrive hver enkelt expression fra et statement fra til en guide omkring p5.js. Du vil få en expression ad gangen, som skal beskrives kort og præcist uden gentagelser. Færdiggør nedenståede sætning: {0} betyder, at
`.trim();

export const subsequentExpressionPrompt = `Færdiggør nedenståede sætning: {0} betyder, at `.trim();

export const classificationPrompt = `
Classify the used syntax in the following code sample: 
{0}

Valid classifications:
{1}

Write only the classification names and most relevant classifications
`.trim();