let hourInput; 
let hourInputValue; 

function setup() {
	hourInput = createInput("3.4");
	
	let button = createButton("Alert");
	button.mousePressed(handleClick);
}

function handleClick() {
	readValues();
	alert("hours: " + hourInputValue);
}

function readValues() {
	hourInputValue = parseFloat(hourInput.value()) * 100;
}
