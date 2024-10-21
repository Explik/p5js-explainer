// ###########################################################
// Run this script on https://www.w3schools.com/js/default.asp
// ###########################################################
const buffer = [];

const linkElements = document.querySelectorAll("#leftmenuinnerinner a[target='_top']");
for (let i = 0; i < linkElements.length; i++) {
    const linkElement = linkElements[i];
    const linkText = linkElement.innerText;
    const linkHref = linkElement.href;

    // Stop collection when the "JS Versions" link is reached
    if (linkText.toLowerCase() === "js versions")
        break;

    buffer.push({
        text: linkText,
        link: linkHref
    });
}

console.log(JSON.stringify(buffer, null, 2));