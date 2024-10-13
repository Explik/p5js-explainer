function setup() {
  noCanvas();

  const label = "hello " + 4 * 6;
  let helloWorldButton = createButton(label);
  helloWorldButton.mousePressed(sayHelloWorld);
}

function sayHelloWorld() {
  console.log("Hello logs from button click" + "!");
}
