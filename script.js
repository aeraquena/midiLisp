let input = {
    main: {op: 0, args: [{type: 0, val: 2},{type: 1, val: 0}]},
    memory: [
        {op: 1, args: [{type: 0, val: 3},{type: 1, val: 1}]},
        {op: 0, args: [{type: 0, val: 4},{type: 0, val: 5}]},
    ]
};

let OP_MAP = {
    0: '+',
    1: '-'
}
let TYPE_MAP = ['int', 'ref'];
let REF_MAP = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p'];

function outputJSON(input) {

    let json = {};
    json['main'] = expressionFromState(input.main);

    input.memory.forEach((bank, index) => {
        let ref = REF_MAP[index];
        json[ref] = expressionFromState(bank);
    });

    return json;
};

function expressionFromState(state) {
    let expression = [];

    expression.push(OP_MAP[state.op]);
    state.args.forEach(arg => {
        let type = TYPE_MAP[arg.type];
        if (type == 'int') {
            expression.push(arg.val);
        } else {
            //Ref
            expression.push(REF_MAP[arg.val])
        }
    });

    return expression;
}

let library = {
    '+': (a,b) => a+b,
    '-': (a,b) => a-b,
};

function interpret(expression) {

    console.log(expression);
    if (Array.isArray(expression) && expression.length > 0) {
        let op = library[expression[0]];
        
        if (op) {
            let args = expression.slice(1).map(interpret);
            return op.apply(null, args);
        }
    } else if (typeof expression === 'string' && expression.match(/[a-h]/)){
      let sub = library[expression];
      return interpret(sub);
    } else {
        return expression;
    }
};

function run(input) {

    let main = expressionFromState(input.main);

    input.memory.forEach((bank, index) => {
        let ref = REF_MAP[index];
        library[ref] = expressionFromState(bank);
    });

    return interpret(main);
};

let lispJson = outputJSON(input);

// event listener -- on receiving update

// Main (current state of the board) can be displayed differently - it's the only thing that changes

// Print out a node with a different color for every one. Map colors
// Maybe each variable can have a different color

// EVALUATE EACH EXPRESSION
// For every variable (if it's a letter from a-h, and NOT a number) -- we want to insert

const page = document.getElementById("page");

const addRow = (key) => {
  const rowDiv = document.createElement("div");
  rowDiv.classList.add("row", "row-" + key);

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

console.log(run(input));