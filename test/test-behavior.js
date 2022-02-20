import sheet, { registerBehavior } from '../src/main.js';

QUnit.module('Property - behavior');

QUnit.test('Updates on state changes', assert => {
  class Counter {
    count = 0;

    increment() {
      this.count++;
    }

    bind() {
      let { count } = this;

      return sheet`
        button {
          attr[id]: get(item(), ${item => `item-${item.id}`});
          event[click]: ${this.increment};
        }

        .count {
          text: ${count};
        }
      `;
    }
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
      behavior: mount(${Counter});
    }
  `.update(root);

  root.querySelector('#item-2').dispatchEvent(new Event('click'));

  assert.equal(root.querySelector('#item-1 + .count').textContent, 0, 'First item not updated');
  assert.equal(root.querySelector('#item-2 + .count').textContent, 1, 'Second item updated');
});

QUnit.test('Unbinds when mount changes', assert => {
  class Counter {
    static incrementCalled = false;
    count = 0;

    increment() {
      Counter.incrementCalled = true;
      this.count++;
    }

    bind() {
      let { count, increment } = this;
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
        class-toggle[counter]: ${isCounter};
      }

      .counter {
        --item: ${{ id: 1 }};
        behavior: mount(${Counter});
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
  assert.equal(Counter.incrementCalled, false, 'Didn\'t get called due to unmount');
});

QUnit.test('Unbinds nested mounts', assert => {
  let root = document.createElement('main');
  root.innerHTML = `
    <div id="app"><div class="one show"><div class="two"><button class="inc">inc</button></div></div>
  `;
  let count = 0;
  let inc = () => count++;
  class One {
    bind() {
      return sheet`
        .two {
          behavior: mount(${Two});
        }
      `;
    }
  }
  class Two {
    bind() {
      return sheet`
        .inc {
          event[click]: ${inc};
        }
      `;
    }
  }
  function app(show) {
    return sheet`
      .one {
        class-toggle[show]: ${show};
      }
      .one.show {
        behavior: mount(${One});
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

QUnit.test('Can take inputProperties', assert => {
  class Taker {
    static inputProperties = ['--one'];
    constructor(props) {
      this.initial = props.get('--one');
    }
    bind(props) {
      let value = props.get('--one');
      return sheet`
        #inner {
          text: ${value + '-' + this.initial};
        }
      `;
    }
  }

  let root = document.createElement('main');
  root.innerHTML = `
    <div id="app"><div id="inner"></div></div>
  `;
  function run(value) {
    return sheet`
      #app {
        --one: ${value};
        behavior: mount(${Taker});
      }
    `;
  }
  run("first").update(root);
  let inner = root.querySelector('#inner');
  assert.equal(inner.textContent, 'first-first');
  run("second").update(root);
  assert.equal(inner.textContent, 'second-first');
  run("third").update(root);
  assert.equal(inner.textContent, 'third-first');
});

QUnit.test('Can take multiple mounted behaviors', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"><div id="inner"></div></div>`;
  let count1 = 0;
  class One {
    bind() {
      return sheet`
        #inner {
          class-toggle[one]: true;
          event[foo]: ${() => count1++};
        }
      `;
    }
  }
  let count2 = 0;
  class Two {
    bind() {
      return sheet`
        #inner {
          class-toggle[two]: true;
          event[foo]: ${() => count2++};
        }
      `;
    }
  }
  function run(solo) {
    return sheet`
      #app {
        behavior: mount(${One}), mount(${Two});
        class-toggle[solo]: ${solo};
      }
      #app.solo {
        behavior: mount(${One});
      }
    `;
  }
  run().update(root);
  let inner = root.firstElementChild.firstElementChild;
  assert.equal(inner.classList.contains('one'), true);
  assert.equal(inner.classList.contains('two'), true);

  
  run(true).update(root);
  inner.dispatchEvent(new CustomEvent('foo'));
  assert.equal(count2, 0);
  assert.equal(count1, 1);
});

QUnit.test('registerBehavior allows defining named behaviors', assert => {
  registerBehavior('one', class {
    bind() {
      return sheet`
        #inner {
          text: "works";
        }
      `
    }
  });
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"><div id="inner"></div></div>`;
  sheet`
    #app {
      behavior: mount(one);
    }
  `.update(root);
  let inner = root.firstElementChild.firstElementChild;
  assert.equal(inner.textContent, 'works');
});

QUnit.only('wrap will wrap a function inside of the mountpoint', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"><div id="inner"></div></div>`;
  let run;
  class One {
    constructor(_p, { wrap }) {
      run = wrap(() => {
        this.text = 'works';
      });
    }

    bind() {
      const { text = 'does not work' } = this;
      return sheet`
        #inner {
          text: ${text};
        }
      `;
    }
  }
  sheet`
    #app {
      behavior: mount(${One});
    }
  `.update(root);

  let inner = root.firstElementChild.firstElementChild;
  run();
  assert.equal(inner.textContent, 'works');
});