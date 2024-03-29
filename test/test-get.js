import sheet from '../src/main.js';

QUnit.module('Function - get()');

QUnit.test('can take an insertion as the first arg', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app">Hello <span id="name"></span></div>`;
  let pet = { name: 'Wilbur' };
  let bindings = sheet`
    #name {
      text: get(${pet}, "name");
    }
  `;
  bindings.update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello Wilbur');
});

QUnit.test('can take an identifier as the second arg', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app">Hello <span id="name"></span></div>`;
  let pet = { name: 'Wilbur' };
  let bindings = sheet`
    #name {
      text: get(${pet}, name);
    }
  `;
  bindings.update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello Wilbur');
});

QUnit.test('can take a var as the first arg', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app">Hello <span id="name"></span></div>`;
  let pet = { name: 'Wilbur' };
  let bindings = sheet`
    #name {
      --pet: ${pet};
      text: get(var(--pet), name);
    }
  `;
  bindings.update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello Wilbur');
});

QUnit.test('can take a function as the second arg', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app">Hello <span id="name"></span></div>`;
  let pet = { name: 'Wilbur' };
  let bindings = sheet`
    #name {
      --pet: ${pet};
      text: get(var(--pet), ${pet => pet.name});
    }
  `;
  bindings.update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello Wilbur');
});

QUnit.test('if one arg, use item() as the context', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div><template>Hello <span id="name"></span></template>`;
  let pet = { name: 'Wilbur' };
  let bindings = sheet`
    #app {
      each: ${[pet]} select(template);
    }
    #name {
      text: get(item(), name);
    }
  `;
  bindings.update(root);
  assert.equal(root.firstElementChild.textContent, 'Hello Wilbur');
});

QUnit.test('Getting an undefined var restores initial value', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app">initial</div>`;
  function bind(show) {
    return sheet`
      #app {
        class-toggle: show ${show};
        text: "new text";
      }
      .show {
        text: get(var(--not-exists), prop);
      }
    `;
  }
  let app = root.firstElementChild;
  bind(false).update(root);
  assert.equal(app.textContent, 'new text');
  bind(true).update(root);
  assert.equal(app.textContent, 'initial');
});