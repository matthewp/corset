import sheet, { registerCustomFunction } from '../src/main.js';

QUnit.module('registeryCustomFunction');

QUnit.test('Can register simple custom functions', assert => {
  registerCustomFunction('--add-one', class {
    call([a, b]) {
      return a + b;
    }
  });
  let root = document.createElement('main');
  root.innerHTML = `
    <div id="app"><span class="result"></span></div>
  `;
  let binding = sheet`
    .result {
      text: --add-one(${1}, ${2});
    }
  `;
  binding.update(root);
  let r = root.querySelector('.result');
  assert.equal(r.textContent, 3);
});

QUnit.test('Can use inputProperties', assert => {
  registerCustomFunction('--add-two', class {
    static inputProperties = ['--start'];
    call([a, b], props) {
      return a + b + props.get('--start');
    }
  });
  let root = document.createElement('main');
  root.innerHTML = `
    <div id="app"><span class="result"></span></div>
  `;
  let binding = sheet`
    #app {
      --start: ${3};
    }

    .result {
      text: --add-two(${1}, ${2});
    }
  `;
  binding.update(root);
  let r = root.querySelector('.result');
  assert.equal(r.textContent, 6);
});

QUnit.test('Custom functions can call `createStore` to create a mutable store', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;

  let next = () => {};
  registerCustomFunction('--fn-that-updates', class {
    call([foo], props, { createStore }) {
      let i = 0;
      let store = createStore();
      store.set('foo', foo);
      next = () => {
        let value;
        switch(i) {
          case 0: value = 'baz'; break;
          case 1: value = 'qux'; break;
        }
        i++;
        store.set('foo', value);
      };
      return store;
    }
  });

  sheet`
    #app {
      --value: --fn-that-updates("bar");
      --foo: get(var(--value), foo);
      data[foo]: var(--foo);
    }
  `.update(root);

  let app = root.firstElementChild;
  assert.equal(app.dataset.foo, "bar");
  next();
  assert.equal(app.dataset.foo, "baz");
  next();
  assert.equal(app.dataset.foo, "qux");
});