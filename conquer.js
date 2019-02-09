const Conquer = new Vue({
  el: '#conquer',
  data: {
    wires: 2,
    moments: 4,
    state: math.matrix([1, 0, 0, 0]),
    step: 0,
    operations: [
      ["ID", "ID"],
      ["ID", "ID"],
      ["ID", "ID"],
      ["ID", "ID"],
    ],
    GATES: GATES,
  },
  methods: {
    simulateForward: function () {
      const step = this.step;
      if (this.step !== this.moments) {
        this.state = math.multiply(this.state, this.getOperationMatrix(step + 1));
      }
    },
    simulateBackward: function () {
      const step = this.step;
      if (step !== 0) {
        this.state = math.multiply(this.state, this.getOperationMatrix(step));
      }
    },
    joinControlledNot: function (step) {
      let operations = this.operations[step];
      let result = [];
      for (let i = 0; i < operations.length; i++) {
        if (operations[i] === "cXControl") {
          result.push(GATES.cX);
          i++;
          continue;
        } else if (operations[i] === "cXTarget") {
            result.push(GATES.fcX);
            i++;
            continue;
        }
        result.push(GATES[operations[i]]);
      }
      return result;
    },
    getOperationMatrix: function (step) {
      return this.joinControlledNot(step).reduce((a, v) => math.kron(a, v));
    },
  },
});

$('select.dropdown').dropdown();
