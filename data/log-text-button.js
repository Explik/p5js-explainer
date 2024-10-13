let textInput;

function setup() {
    noCanvas();
    
    textInput = createInput();
    
    let addTextToLogButton = createButton("Add text to log");
    addTextToLogButton.mousePressed(addTextToLog);
}

function addTextToLog() {
    let textValue = textInput.value();
    console.log(textValue);
}