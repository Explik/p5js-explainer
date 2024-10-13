function setup() {
  noCanvas();

  let helloWorldButton = createButton("Say hello world");
  helloWorldButton.mousePressed(sayHelloWorld);
}

function sayHelloWorld() {
  console.log("Hello logs from button click");
}