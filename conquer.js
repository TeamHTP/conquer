const Conquer = new Vue({
  el: '#conquer',
  data: {
    wires: 3,
    moments: 5,
    circuitStyle: '',
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
      this.circuitStyle = `width: ${val * 180}px;`;
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

var drake = dragula([document.getElementById('toolbox')].concat(Array.from(document.getElementsByClassName('slot'))), {
  isContainer: function (el) {
    return false;
  },
  moves: function (el, source, handle, sibling) {
    return true;
  },
  accepts: function (el, target, source, sibling) {
    return target.className !== 'toolbox' && (target.childNodes.length == 0 || target.childNodes[0].classList.contains('gu-transit'));
  },
  invalid: function (el, handle) {
    return false;
  },
  direction: 'horizontal',
  copy: function (el, source) {
    return source.className === 'toolbox';
  },
  copySortSource: false,
  revertOnSpill: function (el) {
    return el.getAttribute('gate') === 'cXt';
  },
  removeOnSpill: function (el) {
    return el.getAttribute('gate') !== 'cXt';
  },
  mirrorContainer: document.body,
  ignoreInputTextSelection: true
});

drake.on('drop', function (el, target, source, sibling) {
  checkPlacement(el, target, source);
});

function checkPlacement(el, target, source) {
  var validPlacement = true;
  var row = parseInt(target.getAttribute('row'), 10);
  var moment = target.getAttribute('moment');
  if (el.getAttribute('gate') === 'cX') {
    var targetRow = row + 1;
    if (targetRow >= Conquer.wires) {
      targetRow = row - 1;
    }
    if (document.querySelector(`div[row="${targetRow}"][moment="${moment}"]`).childNodes.length > 0) {
      if (!hasGate(document.querySelector(`div[row="${targetRow}"][moment="${moment}"]`), 'cXt')) {
        targetRow = row - 1;
      }
    }
    if (targetRow == -1) {
      validPlacement = false;
    }
    else {
      var targetMomentEls = document.querySelectorAll(`[moment="${moment}"]`);
      var cXCount = 0;
      var cXtCount = 0;
      for (var i = 0; i < targetMomentEls.length; i++) {
        if (hasGate(targetMomentEls[i], 'cX')) {
          cXCount += 1;
        }
        if (hasGate(targetMomentEls[i], 'cXt')) {
          cXtCount += 1;
        }
      }
      if (cXCount > 1) {
        validPlacement = false;
      }

      var targetEl = document.querySelector(`div[row="${targetRow}"][moment="${moment}"]`);
      if (targetEl.childNodes.length !== 0 && !hasGate(targetEl, 'cXt')) {
        validPlacement = false;
      }
      else {
        if (validPlacement && cXtCount === 0) {
          targetEl.innerHTML = `<div class="one-tall cx gate" gate="cXt" id="cXTarget">CXt</div>`;
        }
      }
    }
  }
  else if (el.getAttribute('gate') === 'cXt') {
    validPlacement = false;
    if (hasGate(document.querySelector(`div[row="${row + 1}"][moment="${moment}"]`), 'cX')) {
      validPlacement = true;
    }
    else if (hasGate(document.querySelector(`div[row="${row - 1}"][moment="${moment}"]`), 'cX')) {
      validPlacement = true;
    }
    if (!validPlacement) {
      var targetMomentEls = document.querySelectorAll(`div[moment="${moment}"]`);
      for (var i = 0; i < targetMomentEls.length; i++) {
        if (hasGate(targetMomentEls[i], 'cX')) {
          targetMomentEls[i].removeChild(targetMomentEls[i].childNodes[0]);
          break;
        }
      }
    }
  }
  if (!validPlacement) {
    el.parentElement.removeChild(el);
    Conquer.operations[moment][row] = 'ID';
  }
  else {
    Conquer.operations[moment][row] = el.getAttribute('gate');
  }
  if (source !== null) {
    var sourceMomentEls = document.querySelectorAll(`div[moment="${source.getAttribute('moment')}"]`);
    for (var i = 0; i < sourceMomentEls.length; i++) {
      if (sourceMomentEls[i].childNodes.length === 1 && sourceMomentEls[i].getAttribute('row') != row) {
        checkPlacement(sourceMomentEls[i].childNodes[0], sourceMomentEls[i], null);
      }
    }
  }
}

function hasGate(el, gate) {
  if (el === null || typeof el === 'undefined' || el.childNodes.length === 0) {
    return false;
  }
  else {
    return (el.childNodes[0].getAttribute('gate') === gate);
  }
}
