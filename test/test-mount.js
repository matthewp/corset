import sheet from '../src/main.js';

QUnit.module('Property - mount');

QUnit.test('Updates on state changes', assert => {
  function Counter(state) {
    const { count = 0 } = state;

    function increment() {
      state.count = count + 1;
    }

    return sheet`
      button {
        attr: id get(item(), ${item => `item-${item.id}`});
        event: click ${increment};
      }

      .count {
        text: ${count};
      }
    `;
  }


  let root = document.createElement('main');
  root.innerHTML = `
    <template id="counter-template"><div class="counter"><button type="button">Increment</button><span class="count"></span></div></template>
    <div id="app"></div>
  `;

  sheet`
    #app {
      each-template: select(#counter-template);
      each-items: ${[{ id: 1 }, { id: 2 }]};
      each-key: id;
    }

    .counter {
      mount: ${Counter};
    }
  `.update(root);

  root.querySelector('#item-2').dispatchEvent(new Event('click'));

  assert.equal(root.querySelector('#item-1 + .count').textContent, 0, 'First item not updated');
  assert.equal(root.querySelector('#item-2 + .count').textContent, 1, 'Second item updated');
});

QUnit.test('Unbinds when mount changes', assert => {
  let incrementCalled = false;
  function Counter(state) {
    const { count = 0 } = state;

    function increment() {
      incrementCalled = true;
      state.count = count + 1;
    }

    return sheet`
      button {
        attr: id get(var(--item), ${item => `item-${item.id}`});
        event: click ${increment};
      }

      .count {
        text: ${count};
      }
    `;
  }


  let root = document.createElement('main');
  root.innerHTML = `
    <div id="app">
    <div class="counter"><button type="button">Increment</button><span class="count"></span></div>
    </div>
  `;

  function update(isCounter) {
    sheet`
      #app > div {
        class-toggle: counter ${isCounter};
      }

      .counter {
        --item: ${{ id: 1 }};
        mount: ${Counter};
      }
    `.update(root);
  }

  update(true);

  let countEl = root.querySelector('.count');
  assert.equal(countEl.textContent, 0);

  // Remove class
  update(false);
  root.querySelector('#item-1').dispatchEvent(new Event('click'));
  assert.equal(countEl.textContent, 0);
  assert.equal(incrementCalled, false, 'Didn\'t get called due to unmount');
});

QUnit.test('Unbinds nested mounts', assert => {
  let root = document.createElement('main');
  root.innerHTML = `
    <div id="app"><div class="one show"><div class="two"><button class="inc">inc</button></div></div>
  `;
  let count = 0;
  let inc = () => count++;
  function One() {
    return sheet`
      .two {
        mount: ${Two};
      }
    `;
  }
  function Two() {
    return sheet`
      .inc {
        event[click]: ${inc};
      }
    `;
  }
  function app(show) {
    return sheet`
      .one {
        class-toggle[show]: ${show};
      }
      .one.show {
        mount: ${One};
      }
    `;
  }
  app(true).update(root);
  let btn = root.querySelector('.inc');
  btn.dispatchEvent(new Event('click'));
  assert.equal(count, 1, 'incremented');
  //assert.equal(root.querySelector('.name').textContent, 'world');
  app(false).update(root);
  btn.dispatchEvent(new Event('click'));
  assert.equal(count, 1, 'did not increment');
});