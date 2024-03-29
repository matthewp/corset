import sheet from '../src/main.js';

QUnit.module('Property - --custom-prop');

QUnit.test('Can be set on the element where used', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app">Hello <span id="name"></span></div>`;
  let bindings = sheet`
    #name {
      --name: ${'Wilbur'};
      text: var(--name);
    }
  `;
  bindings.update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello Wilbur');
});

QUnit.test('Can be set on a parent element', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app">Hello <span id="name"></span></div>`;
  let bindings = sheet`
    #app {
      --name: ${'Wilbur'};
    }

    #name {
      text: var(--name);
    }
  `;
  bindings.update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello Wilbur');
});

QUnit.test('Can take a fallback value', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app">Hello <span id="name"></span></div>`;
  let bindings = sheet`
    #name {
      text: var(--name, "default");
    }
  `;
  bindings.update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello default');
});

QUnit.test('Can take another var as a fallback value', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app">Hello <span id="name"></span></div>`;
  let bindings = sheet`
    #name {
      --pet: ${'Wilbur'};
      text: var(--name, var(--pet));
    }
  `;
  bindings.update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello Wilbur');
});

QUnit.test('Dash property names work', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;
  let bindings = sheet`
    #app {
      --my-prop: "testing";
      text: var(--my-prop);
    }
  `;
  bindings.update(root);
  assert.equal(root.firstElementChild.textContent, 'testing');
});

QUnit.test('Can be used as a function', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;
  let bindings = sheet`
    #app {
      --concat: ${(...args) => args.join('')};
      text: --concat("one", " ", "two");
    }
  `;
  bindings.update(root);
  assert.equal(root.firstElementChild.textContent, 'one two');
});

QUnit.test('Are removed when the selector no longer matches', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;
  function run(showOne) {
    return sheet`
      #app {
        class-toggle: one ${showOne};
        attr: data-one var(--v, none);
      }
      .one {
        --v: two;
        --another: three;
      }
    `;
  }
  let app = root.firstElementChild;
  run(true).update(root);
  assert.equal(app.getAttribute('data-one'), 'two');
  run(false).update(root);
  assert.equal(app.getAttribute('data-one'), 'none');
});