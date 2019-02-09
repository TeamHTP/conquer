class Duq {

  constructor() {
    this.qReg = [];
    this.cReg = [];
  }

}

class Qubit {

  constructor(u, d) {
    this.u = u;
    this.d = d;
  }

  collapse() {
    return Math.random() < this.probability();
  }

  probability() {
    return math.multiply(this.d, this.d);
  }

  asMatrix() {
    return math.matrix([this.u, this.d]);
  }

  toString() {
    return `(${math.number(this.u)} ${math.number(this.d)})`;
  }

}

math.config({
  number: 'BigNumber',
  precision: 64
});

var UTILS = {};
UTILS.tensorProduct = (matrix1, matrix2) => {
  var product = [];
  for (var x = 0; x < matrix1.size()[0]; x++) {
    for (var y = 0; y < matrix2.size()[0]; y++) {
      product[(x * matrix1.size()[0]) + y] = math.multiply(matrix1._data[x], matrix2._data[y]);
    }
  }
  return math.matrix(product);
};
UTILS.tensorFactor = (matrix1) => {

};

var GATES = {};
// Hadamard
GATES.H = (qubit1) => {
  var hadamardMatrix = math.matrix([
    [math.divide(math.bignumber(1), math.eval("sqrt(2)")), math.divide(math.bignumber(1), math.eval("sqrt(2)"))],
    [math.divide(math.bignumber(1), math.eval("sqrt(2)")), math.divide(math.bignumber(-1), math.eval("sqrt(2)"))]
  ]);
  var result = math.multiply(hadamardMatrix, qubit1.asMatrix());
  return {
    qubit1: new Qubit(result._data[0], result._data[1])
  };
};

// Controlled X
GATES.cX => (qubit1, qubit2) {
  var cXMatrix = math.matrix([
    [math.bignumber(1), math.bignumber(0), math.bignumber(0), math.bignumber(0)],
    [math.bignumber(0), math.bignumber(1), math.bignumber(0), math.bignumber(0)],
    [math.bignumber(0), math.bignumber(0), math.bignumber(0), math.bignumber(1)],
    [math.bignumber(0), math.bignumber(0), math.bignumber(1), math.bignumber(0)]
  ]);
  var tensorProduct = UTILS.tensorProduct(qubit1, qubit2);
  var tensorFactor = UTILS.tensorFactor(math.multiply(tensorProduct, cXMatrix));
  return {
    qubit1: new Qubit(tensorFactor[0]._data[0], tensorFactor[0]._data[1]),
    qubit2: new Qubit(tensorFactor[1]._data[0], tensorFactor[1]._data[1])
  };
};
