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

QUnit.test('can take an identifier as the second arg', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app">Hello <span id="name"></span></div>`;
  let pet = { name: 'Wilbur' };
  let sheet = dsl`
    #name {
      text: get(${pet}, name);
    }
  `;
  sheet.update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello Wilbur');
});

QUnit.test('can take a var as the first arg', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app">Hello <span id="name"></span></div>`;
  let pet = { name: 'Wilbur' };
  let sheet = dsl`
    #name {
      --pet: ${pet};
      text: get(var(--pet), name);
    }
  `;
  sheet.update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello Wilbur');
});

QUnit.test('can take a function as the second arg', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app">Hello <span id="name"></span></div>`;
  let pet = { name: 'Wilbur' };
  let sheet = dsl`
    #name {
      --pet: ${pet};
      text: get(var(--pet), ${pet => pet.name});
    }
  `;
  sheet.update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello Wilbur');
});

QUnit.test('if one arg, implicitly uses --scope as the context', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app">Hello <span id="name"></span></div>`;
  let pet = { name: 'Wilbur' };
  let sheet = dsl`
    #name {
      --scope: ${pet};
      text: get(name);
    }
  `;
  sheet.update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello Wilbur');
});