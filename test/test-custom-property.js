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