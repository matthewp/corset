import dsl from '../src/dsl.js';

QUnit.module('Property - --custom-prop');

QUnit.test('Can be set on the element where used', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app">Hello <span id="name"></span></div>`;
  let sheet = dsl`
    #name {
      --name: ${'Wilbur'};
      text: var(--name);
    }
  `;
  sheet.update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello Wilbur');
});

QUnit.test('Can be set on a parent element', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app">Hello <span id="name"></span></div>`;
  let sheet = dsl`
    #app {
      --name: ${'Wilbur'};
    }

    #name {
      text: var(--name);
    }
  `;
  sheet.update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello Wilbur');
});

QUnit.test('Can take a fallback value', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app">Hello <span id="name"></span></div>`;
  let sheet = dsl`
    #name {
      text: var(--name, "default");
    }
  `;
  sheet.update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello default');
});

QUnit.test('Can take another var as a fallback value', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app">Hello <span id="name"></span></div>`;
  let sheet = dsl`
    #name {
      --pet: ${'Wilbur'};
      text: var(--name, var(--pet));
    }
  `;
  sheet.update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello Wilbur');
});

QUnit.test('Dash property names work', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;
  let sheet = dsl`
    #app {
      --my-prop: "testing";
      text: var(--my-prop);
    }
  `;
  sheet.update(root);
  assert.equal(root.firstElementChild.textContent, 'testing');
});