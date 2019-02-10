math.config({
  number: 'BigNumber',
  precision: 64
});

var GATES = {};
// Hadamard
GATES.H = math.matrix([
  [math.eval('1 / sqrt(2)'), math.eval('1 / sqrt(2)')],
  [math.eval('1 / sqrt(2)'), math.eval('-1 / sqrt(2)')],
]);

// Controlled X
GATES.cX = math.matrix([
  [math.bignumber(1), math.bignumber(0), math.bignumber(0), math.bignumber(0)],
  [math.bignumber(0), math.bignumber(1), math.bignumber(0), math.bignumber(0)],
  [math.bignumber(0), math.bignumber(0), math.bignumber(0), math.bignumber(1)],
  [math.bignumber(0), math.bignumber(0), math.bignumber(1), math.bignumber(0)],
]);

// Filled Controlled X
GATES.fcX = math.matrix([
  [math.bignumber(1), math.bignumber(0), math.bignumber(0), math.bignumber(0)],
  [math.bignumber(0), math.bignumber(0), math.bignumber(0), math.bignumber(1)],
  [math.bignumber(0), math.bignumber(0), math.bignumber(1), math.bignumber(0)],
  [math.bignumber(0), math.bignumber(1), math.bignumber(0), math.bignumber(0)],
]);

// Pauli X Rotate
GATES.X = math.matrix([
  [math.bignumber(0), math.bignumber(1)],
  [math.bignumber(1), math.bignumber(0)],
]);

// Pauli Y Rotate
GATES.Y = math.matrix([
  [math.bignumber(0), math.complex('i')],
  [math.complex('-i'), math.bignumber(0)],
]);

// Pauli Z Rotate
GATES.Z = math.matrix([
  [math.bignumber(1), math.bignumber(0)],
  [math.bignumber(0), math.bignumber(-1)],
]);

// Swap
GATES.SWAP = math.matrix([
  [math.bignumber(1), math.bignumber(0), math.bignumber(0), math.bignumber(0)],
  [math.bignumber(0), math.bignumber(0), math.bignumber(1), math.bignumber(0)],
  [math.bignumber(0), math.bignumber(1), math.bignumber(0), math.bignumber(0)],
  [math.bignumber(0), math.bignumber(0), math.bignumber(0), math.bignumber(1)],
]);

// Square Root Swap
GATES.sqrtSWAP = math.matrix([
  [math.bignumber(1), math.bignumber(0), math.bignumber(0), math.bignumber(0)],
  [math.bignumber(0), math.eval('(1/2)*(1+i)'), math.eval('(1/2)*(1-i)'), math.bignumber(0)],
  [math.bignumber(0), math.eval('(1/2)*(1-i)'), math.eval('(1/2)*(1+i)'), math.bignumber(0)],
  [math.bignumber(0), math.bignumber(0), math.bignumber(0), math.bignumber(1)],
]);

GATES.ID = math.identity(2);

var Duq = {};
Duq.buildStepOperatorMatrix = (operatorArray) => {
  if (GATES[operatorArray[0]].size() == 4) {
    return GATES[operatorArray[0]];
  }
  else {
    return math.kron(GATES[operatorArray[0]], GATES[operatorArray[1]]);
  }
};
Duq.printMatrix = (matrix) => {
  for (var c = 0; c < matrix._data[0].length; c++) {
    var line = '';
    for (var r = 0; r < matrix._data.length; r++) {
      line += `${math.number(matrix._data[r][c])} `;
    }
    console.log(`${line}\n`);
  }
};
