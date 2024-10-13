// ###########################################################
// Run this script on https://p5js.org/reference/
// ###########################################################
const buffer = [];

const linkElements = document.querySelectorAll("#main-content a.group");
for (let i = 0; i < linkElements.length; i++) {
    const linkElement = linkElements[i];
    const linkTextElement = linkElement.querySelector("span");
    
    const linkText = linkTextElement.innerText;
    const linkHref = linkElement.href;

    buffer.push({
        text: linkText,
        link: linkHref
    });
}

console.log(JSON.stringify(buffer, null, 2));