const lispJson = {
  main: ["+", "a", "b"],
  a: ["+", 1, 2],
  b: ["+", "a", "a"],
  c: ["+", 0, 0],
  d: ["+", 0, 0],
  e: ["+", 0, 0],
  f: ["+", 0, 0],
  g: ["+", 0, 0],
  h: ["+", 0, 0],
};
// event listener -- on receiving update

// Main (current state of the board) can be displayed differently - it's the only thing that changes

// Print out a node with a different color for every one. Map colors
// Maybe each variable can have a different color

// EVALUATE EACH EXPRESSION
// For every variable (if it's a letter from a-h, and NOT a number) -- we want to insert

const page = document.getElementById("page");

const addRow = (key) => {
  const rowDiv = document.createElement("div");
  rowDiv.classList.add("row");

  // variable
  const varOuterDiv = document.createElement("div");
  varOuterDiv.classList.add("varOuter");
  const varDiv = document.createElement("div");
  varDiv.classList.add("var", "node");
  const varText = document.createTextNode(key);
  varDiv.appendChild(varText);
  varOuterDiv.appendChild(varDiv);
  rowDiv.appendChild(varOuterDiv);

  // expression
  const expDiv = document.createElement("div");
  expDiv.classList.add("exp");
  for (i in lispJson[key]) {
    const expComponentDiv = document.createElement("div");
    expComponentDiv.classList.add("expComponent", "node");
    const expComponentText = document.createTextNode(lispJson[key][i]);
    expComponentDiv.appendChild(expComponentText);
    expDiv.appendChild(expComponentDiv);
  }
  rowDiv.appendChild(expDiv);

  page.appendChild(rowDiv);
};

for (key in lispJson) {
  addRow(key);
}
