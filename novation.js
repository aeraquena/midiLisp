// =============================================================================
// STATE MANAGEMENT
// =============================================================================

// Main input object - always valid JSON
let input = {
  main: {
    op: 0,
    args: Array(8)
      .fill()
      .map(() => ({ type: 0, val: 0 })),
  },
  banks: Array(16)
    .fill()
    .map(() => ({
      op: 0,
      args: Array(8)
        .fill()
        .map(() => ({ type: 0, val: 0 })),
    })),
};

// Track raw MIDI CC values for op code faders (CC 77-84)
let faderValues = new Array(8).fill(0);

// Track raw MIDI CC values for type/val pairs
let typeValues = new Array(8).fill(0); // CC 13-20
let valValues = new Array(8).fill(0); // CC 29-36

// Map MIDI note numbers to bank indices
const noteToBankIndex = {
  41: 0,
  42: 1,
  43: 2,
  44: 3,
  57: 4,
  58: 5,
  59: 6,
  60: 7,
  73: 8,
  74: 9,
  75: 10,
  76: 11,
  89: 12,
  90: 13,
  91: 14,
  92: 15,
};

// =============================================================================
// OP CODE CALCULATION
// =============================================================================

function calculateOpCode() {
  let result = 0;
  for (let i = 0; i < 8; i++) {
    const bit = faderValues[i] >= 64 ? 1 : 0;
    result |= bit << (7 - i); // CC 77 is MSB (bit 7), CC 84 is LSB (bit 0)
  }
  return result;
}

// =============================================================================
// STATE UPDATE FUNCTIONS
// =============================================================================

function updateMainState() {
  // Update op code from faders
  input.main.op = calculateOpCode();

  // Update args from type/val pairs
  for (let i = 0; i < 8; i++) {
    input.main.args[i].type = typeValues[i];
    input.main.args[i].val = valValues[i];
  }
}

function saveBankSnapshot(bankIndex) {
  // Deep copy main state to bank
  input.banks[bankIndex] = {
    op: input.main.op,
    args: input.main.args.map((arg) => ({ type: arg.type, val: arg.val })),
  };
  console.log(`Saved to bank ${bankIndex}`);
}

// =============================================================================
// MIDI MESSAGE HANDLING
// =============================================================================

function getMIDIMessage(message) {
  const command = message.data[0] & 0xf0;
  const noteOrControl = message.data[1];
  const value = message.data.length > 2 ? message.data[2] : 0;

  switch (command) {
    case 144: // Note On
      if (value > 0) {
        handleNoteOn(noteOrControl, value);
      }
      break;

    case 128: // Note Off
      // Ignore note off events
      break;

    case 176: // Control Change
      handleControlChange(noteOrControl, value);
      break;
  }

  // Update display after every MIDI message
  updateDisplay();
}

function handleNoteOn(note, velocity) {
  console.log(`Note On: Note ${note}, Velocity: ${velocity}`);

  // Check if this is a bank save button
  if (note in noteToBankIndex) {
    const bankIndex = noteToBankIndex[note];
    saveBankSnapshot(bankIndex);
  }
}

function handleControlChange(cc, value) {
  console.log(`Control Change: CC ${cc}, Value: ${value}`);

  // OP Code Faders (CC 77-84)
  if (cc >= 77 && cc <= 84) {
    const faderIndex = cc - 77;
    faderValues[faderIndex] = value;
    updateMainState();
    return;
  }

  // Type CCs (CC 13-20)
  if (cc >= 13 && cc <= 20) {
    const typeIndex = cc - 13;
    typeValues[typeIndex] = value;
    updateMainState();
    return;
  }

  // Value CCs (CC 29-36)
  if (cc >= 29 && cc <= 36) {
    const valIndex = cc - 29;
    valValues[valIndex] = value;
    updateMainState();
    return;
  }
}

// =============================================================================
// DISPLAY FUNCTIONS
// =============================================================================

function updateDisplay() {
  updateJSONDisplay();
  updateControlsDisplay();
  displayWebpage(input);
}

function updateJSONDisplay() {
  const jsonDisplay = document.getElementById("json-display");
  if (jsonDisplay) {
    jsonDisplay.textContent = JSON.stringify(input, null, 2);
  }
}

function updateControlsDisplay() {
  updateFadersDisplay();
  updateTypesDisplay();
  updateValsDisplay();
}

function updateFadersDisplay() {
  const fadersDiv = document.getElementById("faders-display");
  if (!fadersDiv) return;

  let html = "<h3>OP Code Faders (CC 77-84)</h3>";
  html += "<table><tr><th>CC</th><th>Value</th><th>Bit</th></tr>";

  for (let i = 0; i < 8; i++) {
    const cc = 77 + i;
    const value = faderValues[i];
    const bit = value >= 64 ? 1 : 0;
    html += `<tr><td>CC ${cc}</td><td>${value}</td><td>${bit}</td></tr>`;
  }

  html += "</table>";

  // Show binary representation and decimal
  const binaryStr = faderValues.map((v) => (v >= 64 ? "1" : "0")).join("");
  html += `<p><strong>Binary:</strong> ${binaryStr} = <strong>Decimal:</strong> ${input.main.op}</p>`;

  fadersDiv.innerHTML = html;
}

function updateTypesDisplay() {
  const typesDiv = document.getElementById("types-display");
  if (!typesDiv) return;

  let html = "<h3>Type Knobs (CC 13-20)</h3>";
  html += "<table><tr><th>CC</th><th>Value</th></tr>";

  for (let i = 0; i < 8; i++) {
    const cc = 13 + i;
    const value = typeValues[i];
    html += `<tr><td>CC ${cc}</td><td>${value}</td></tr>`;
  }

  html += "</table>";
  typesDiv.innerHTML = html;
}

function updateValsDisplay() {
  const valsDiv = document.getElementById("vals-display");
  if (!valsDiv) return;

  let html = "<h3>Value Knobs (CC 29-36)</h3>";
  html += "<table><tr><th>CC</th><th>Value</th></tr>";

  for (let i = 0; i < 8; i++) {
    const cc = 29 + i;
    const value = valValues[i];
    html += `<tr><td>CC ${cc}</td><td>${value}</td></tr>`;
  }

  html += "</table>";
  valsDiv.innerHTML = html;
}

// =============================================================================
// MIDI INITIALIZATION
// =============================================================================

function onMIDISuccess(midiAccess) {
  console.log("MIDI ready!");

  const inputs = midiAccess.inputs.values();
  const deviceName = "Launch Control XL";
  let launchControlInput = null;

  for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
    if (input.value.name.includes(deviceName)) {
      console.log(`Found ${input.value.name}!`);
      launchControlInput = input.value;
      break;
    }
  }

  if (launchControlInput) {
    launchControlInput.onmidimessage = getMIDIMessage;
    console.log("MIDI message listener attached");
  } else {
    console.log(`Could not find a MIDI device named "${deviceName}".`);
  }

  // Initial display update
  updateDisplay();
}

function onMIDIFailure() {
  console.log("Could not access your MIDI devices.");
}

// =============================================================================
// STARTUP
// =============================================================================

// Request MIDI access when page loads
navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

// Initialize display once DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", updateDisplay);
} else {
  updateDisplay();
}

/* let input = {
  main: {
    op: 0,
    args: [
      { type: 0, val: 2 },
      { type: 1, val: 0 },
    ],
  },
  banks: [
    {
      op: 1,
      args: [
        { type: 0, val: 3 },
        { type: 1, val: 1 },
      ],
    },
    {
      op: 0,
      args: [
        { type: 0, val: 4 },
        { type: 0, val: 5 },
      ],
    },
  ],
};
*/

let OP_MAP = {
  0: "+",
  1: "-",
};
let TYPE_MAP = ["int", "ref"];
let REF_MAP = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
];

function outputJSON(input) {
  let mainResult = run(input);

  let json = {};
  json["main"] = {
    expression: expressionFromState(input.main),
    result: mainResult,
  };

  input.banks.forEach((bank, index) => {
    let ref = REF_MAP[index];
    let e = expressionFromState(bank);
    json[ref] = {
      expression: e,
      result: interpret(e),
    };
  });

  return json;
}

function expressionFromState(state) {
  let expression = [];

  expression.push(OP_MAP[state.op]);
  state.args.forEach((arg) => {
    let type = TYPE_MAP[arg.type];
    if (type == "int") {
      expression.push(arg.val);
    } else {
      //Ref
      expression.push(REF_MAP[arg.val]);
    }
  });

  return expression;
}

let library = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
};

function interpret(expression) {
  console.log(expression);
  if (Array.isArray(expression) && expression.length > 0) {
    let op = library[expression[0]];

    if (op) {
      let args = expression.slice(1).map(interpret);
      return op.apply(null, args);
    }
  } else if (typeof expression === "string" && expression.match(/[a-h]/)) {
    let sub = library[expression];
    return interpret(sub);
  } else {
    return expression;
  }
}

function run(input) {
  let main = expressionFromState(input.main);

  input.banks.forEach((bank, index) => {
    let ref = REF_MAP[index];
    library[ref] = expressionFromState(bank);
  });

  return interpret(main);
}

// Input is Flavius's input from MIDI
function displayWebpage(input) {
  let lispJson = outputJSON(input);

  const page = document.getElementById("page");

  page.innerHTML = "";

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
}
