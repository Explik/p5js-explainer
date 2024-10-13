let labelWeight;
let textWeight;
let labelHeight;
let textHeight;
let buttonCalculateBMI;
let labelBMI;
let textBMI;

function setup() {
  noCanvas();
  labelWeight = createSpan('Weight (kg)');
  labelWeight.position(10, 30);
  textWeight = createInput();
  textWeight.position(100, 30);
  
  labelHeight = createSpan('Heigth (m)');
  labelHeight.position(10, 60);
  textHeight = createInput();
  textHeight.position(100, 60);
  
  labelBMI = createSpan('BMI');
  labelBMI.position(10,90); 
  textBMI = createInput();
  textBMI.position(100, 90); 
  textBMI.attribute("readonly", ""); 
  
  buttonCalculateBMI = createButton('Calculate BMI');
  buttonCalculateBMI.position(10, 210);
  buttonCalculateBMI.mousePressed(calculateBMI);
}

function calculateBMI() {
  let weight; 
  let height; 
  let bmi;
 
 
  height = parseFloat(textHeight.value()); 
   
  bmi = weight / (height * height);
  
  textBMI.value(bmi);
}
