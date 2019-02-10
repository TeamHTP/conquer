const Conquer = new Vue({
  el: '#conquer',
  data: {
    wires: 4,
    moments: 3,
    circuitStyle: '',
    probabilityStyle: '',
    //wireStates: [math.matrix([1, 0]), math.matrix([1, 0]), math.matrix([1, 0])],
    wireStatesBoolean: [false, false, false, false],
    state: math.matrix([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    step: -1,
    operations: math.map(math.zeros([3, 4]), v => "ID"),
    GATES: GATES,
    probabilities: [0, 0, 0, 0],
    katex: {
      H: katex.renderToString(String.raw`\begin{pmatrix}
   \frac{1}{\sqrt{\smash[b]{2}}} & \frac{1}{\sqrt{\smash[b]{2}}} \\
   \frac{1}{\sqrt{\smash[b]{2}}} & \frac{-1}{\sqrt{\smash[b]{2}}}
\end{pmatrix}`, {throwOnError: false}),
      X: katex.renderToString(String.raw`\begin{pmatrix}
   0 & 1 \\
   1 & 0
\end{pmatrix}`, {throwOnError: false}),
      Y: katex.renderToString(String.raw`\begin{pmatrix}
   0 & -i \\
   i & 0
\end{pmatrix}`, {throwOnError: false}),
      Z: katex.renderToString(String.raw`\begin{pmatrix}
   1 & 0 \\
   0 & -1
\end{pmatrix}`, {throwOnError: false}),
      ID: katex.renderToString(String.raw`\begin{pmatrix}
   1 & 0 \\
   0 & 1
\end{pmatrix}`, {throwOnError: false}),
      cX: katex.renderToString(String.raw`\begin{pmatrix}
   1 & 0 & 0 & 0 \\
   0 & 1 & 0 & 0 \\
   0 & 0 & 0 & 1 \\
   0 & 0 & 1 & 0
\end{pmatrix}`, {throwOnError: false})
    }
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
      if (step == -1) {
        this.state = this.tensorProductState._data[0];
      }
      if (step < this.moments - 1) {
        this.state = math.multiply(this.state, this.getOperationMatrix(step + 1));
        this.step++;
        this.deriveProbabilities();
        this.scrollCircuitView();
      }
    },
    simulateBackward: function () {
      const step = this.step;
      if (step >= 0) {
        this.state = math.multiply(this.state, this.getOperationMatrix(step));
        this.step--;
        this.deriveProbabilities();
        this.scrollCircuitView();
      }
    },
    scrollCircuitView: function() {
      var wWidth = $(window).width();
      var matchPoint = wWidth / 2;
      var delta = ((this.step + 2) * 180) - 64 - matchPoint;
      if (delta > 0) {
        $('#conquer').scrollLeft(delta);
      }
      else {
        $('#conquer').scrollLeft(0);
      }
    },
    joinControlledNot: function (step) {
      let operations = this.operations[step];
      let result = [];
      for (let i = 0; i < operations.length; i++) {
        if (operations[i] === "cX") {
          result.push(GATES.cX);
          i++;
          continue;
        } else if (operations[i] === "cXt") {
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
    resizeMoments: function () {
      var highestUsed = 0;
      for (var m = 0; m < this.operations.length; m++) {
        for (var w = 0; w < this.operations[m].length; w++) {
          if (this.operations[m][w] !== 'ID' && m > highestUsed) {
            highestUsed = m;
          }
        }
      }
      if (highestUsed > this.moments - 3) {
        this.moments += 1;
        this.$forceUpdate();
      }
      if (highestUsed < this.moments - 3) {
        this.moments -= (this.moments - 3 - highestUsed);
        this.$forceUpdate();
      }
      this.$nextTick(function () {
        Array.from(document.querySelectorAll(`.slot[moment="${parseInt(this.moments) - 2}"]`)).forEach((e) => {
          drake.containers.push(e);
        });
      });
    },
    deriveProbabilities: function() {
      for (var w = 0; w < this.wires; w++) {
        var probSum = 0;
        for (var i = 0; i < this.state._data.length; i++) {
          if (math.floor(i / math.pow(2, w)) % 2 == 1) {
            probSum += math.number(math.pow(math.abs(this.state._data[i]), 2));
          }
        }
        this.probabilities[this.wires - w - 1] = probSum;
      }
    },
    gatePopups: function() {
      $('.gate[gate="H"]').popup({popup: '.popup[gate="H"]'});
      $('.gate[gate="X"]').popup({popup: '.popup[gate="X"]'});
      $('.gate[gate="Y"]').popup({popup: '.popup[gate="Y"]'});
      $('.gate[gate="Z"]').popup({popup: '.popup[gate="Z"]'});
      $('.gate[gate="ID"]').popup({popup: '.popup[gate="ID"]'});
      $('.gate[gate="cX"]').popup({popup: '.popup[gate="cX"]'});
    }
  },
  watch: {
    wires: function (val) {
      this.operations = math.resize(this.operations, [this.moments, val], "ID");
      if (val < this.wireStates.length) {
        this.wireStatesBoolean.pop();
      } else if(val > this.wireStates.length) {
        this.wireStatesBoolean.push(false);
      }
      if (val < this.probabilities.length) {
        this.probabilities.pop();
      } else if(val > this.probabilities.length) {
        this.probabilities.push(0);
      }
    },
    moments: function (val) {
      this.operations = math.resize(this.operations, [val, this.wires], "ID");
      this.circuitStyle = `width: ${((val + 2) * 180) - 50}px;`;
    },
    operations: {
      handler: function (val) {
        this.resizeMoments();
      },
      deep: true
    },
    state: {
      handler: function (val) {
        this.deriveProbabilities();
      },
      deep: true
    }
  },
});

$('select.dropdown').dropdown();
Conquer.gatePopups();

var drake = dragula([document.getElementById('toolbox')].concat(Array.from(document.getElementsByClassName('slot'))), {
  isContainer: function (el) {
    return false;
  },
  moves: function (el, source, handle, sibling) {
    return el.classList.contains('gate');
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

drake.on('remove', function (el, container, source) {
  var row = parseInt(source.getAttribute('row'), 10);
  var moment = source.getAttribute('moment');
  Conquer.operations[moment][row] = 'ID';
  Conquer.resizeMoments();
  if (el.getAttribute('gate') === 'cX' || el.getAttribute('gate') === 'cXt') {
    var targetMomentEls = document.querySelectorAll(`div[moment="${moment}"]`);
    for (var i = 0; i < targetMomentEls.length; i++) {
      if (hasGate(targetMomentEls[i], 'cX') || hasGate(targetMomentEls[i], 'cXt')) {
        targetMomentEls[i].removeChild(targetMomentEls[i].childNodes[0]);
        Conquer.operations[moment][targetMomentEls[i].getAttribute('row')] = 'ID';
        Conquer.resizeMoments();
        break;
      }
    }
  }
});

drake.on('drag', function (el, source) {
  el.classList.remove('after');
  el.classList.remove('before');
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
          el.classList.remove(targetRow > row ? 'before' : 'after');
          el.classList.add(targetRow > row ? 'after' : 'before');
          targetEl.innerHTML = `<div class="one-tall cx gate" gate="cXt" id="cXTarget">target</div>`;
          Conquer.operations[moment][targetRow] = 'cXt';
          Conquer.resizeMoments();
        }
      }
    }
  }
  else if (el.getAttribute('gate') === 'cXt') {
    validPlacement = false;
    if (hasGate(document.querySelector(`div[row="${row + 1}"][moment="${moment}"]`), 'cX')) {
      document.querySelector(`div[row="${row + 1}"][moment="${moment}"]`).childNodes[0].classList.add('before');
      document.querySelector(`div[row="${row + 1}"][moment="${moment}"]`).childNodes[0].classList.remove('after');
      validPlacement = true;
    }
    else if (hasGate(document.querySelector(`div[row="${row - 1}"][moment="${moment}"]`), 'cX')) {
      document.querySelector(`div[row="${row - 1}"][moment="${moment}"]`).childNodes[0].classList.add('after');
      document.querySelector(`div[row="${row - 1}"][moment="${moment}"]`).childNodes[0].classList.remove('before');
      validPlacement = true;
    }
    if (!validPlacement) {
      var targetMomentEls = document.querySelectorAll(`div[moment="${moment}"]`);
      for (var i = 0; i < targetMomentEls.length; i++) {
        if (hasGate(targetMomentEls[i], 'cX')) {
          targetMomentEls[i].removeChild(targetMomentEls[i].childNodes[0]);
          Conquer.operations[moment][targetMomentEls[i].getAttribute('row')] = 'ID';
          Conquer.resizeMoments();
          break;
        }
      }
    }
  }
  if (!validPlacement) {
    el.parentElement.removeChild(el);
    Conquer.operations[moment][row] = 'ID';
    Conquer.resizeMoments();
  }
  else {
    Conquer.operations[moment][row] = el.getAttribute('gate');
    Conquer.resizeMoments();
  }
  if (source !== null) {
    if (source.getAttribute('moment') !== null && source.getAttribute('row') !== null) {
      Conquer.operations[source.getAttribute('moment')][source.getAttribute('row')] = 'ID';
      Conquer.resizeMoments();
    }
    var sourceMomentEls = document.querySelectorAll(`div[moment="${source.getAttribute('moment')}"]`);
    for (var i = 0; i < sourceMomentEls.length; i++) {
      if (sourceMomentEls[i].childNodes.length === 1) {
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
