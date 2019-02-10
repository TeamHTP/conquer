const Conquer = new Vue({
  el: '#conquer',
  data: {
    wires: 3,
    moments: 5,
    //wireStates: [math.matrix([1, 0]), math.matrix([1, 0]), math.matrix([1, 0])],
    wireStatesBoolean: [false, false, false],
    state: math.matrix([1, 0, 0, 0, 0, 0, 0, 0]),
    step: -1,
    operations: math.map(math.zeros([5, 3]), v => "ID"),
    GATES: GATES,
  },
  computed: {
    transposedOperations: function () {
      return math.transpose(this.operations);
    },
    tensorProductState: function () {
      return this.wireStates.reduce((a, v) => math.kron(a, v));
    },
    wireStates: function() {
      return this.wireStatesBoolean.map(v => v ? math.matrix([0, 1]) : math.matrix([1, 0]));
    }
  },
  methods: {
    simulateForward: function () {
      const step = this.step;
      if (step < this.moments - 1) {
        this.state = math.multiply(this.state, this.getOperationMatrix(step + 1));
        this.step++;
      }
    },
    simulateBackward: function () {
      const step = this.step;
      if (step >= 0) {
        this.state = math.multiply(this.state, this.getOperationMatrix(step));
        this.step--;
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
  watch: {
    wires: function (val) {
      this.operations = math.resize(this.operations, [this.moments, val], "ID");
      if (val < this.wireStates.length) {
        this.wireStatesBoolean.pop();
      } else if(val > this.wireStates.length) {
        this.wireStatesBoolean.push(false);
      }
      this.$nextTick(function () {
        $('select.dropdown').dropdown();
      });
    },
    moments: function (val) {
      this.operations = math.resize(this.operations, [val, this.wires], "ID");
      this.$nextTick(function () {
        $('select.dropdown').dropdown();
      });
    },
    wireStatesBoolean: function (val) {
      this.state = this.tensorProductState;
    },
  },
});

$('select.dropdown').dropdown();
