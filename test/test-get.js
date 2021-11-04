import dsl from '../src/dsl.js';

QUnit.module('Function - get()');

QUnit.test('can take an insertion as the first arg', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app">Hello <span id="name"></span></div>`;
  let pet = { name: 'Wilbur' };
  let sheet = dsl`
    #name {
      text: get(${pet}, "name");
    }
  `;
  sheet.update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello Wilbur');
});