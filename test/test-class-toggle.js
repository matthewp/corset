import dsl from '../src/dsl.js';

QUnit.module('Property - class-toggle');

QUnit.test('Adds a class when true', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;

  function template(value) {
    return dsl`
      #app {
        class-toggle: on ${value};
      }
    `;
  }

  template(true).update(root);
  assert.equal(root.firstElementChild.classList.contains('on'), true);
  template(false).update(root);
  assert.equal(root.firstElementChild.classList.contains('on'), false);
});

QUnit.test('Removes a class when false', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app" class="on"></div>`;
  assert.equal(root.firstElementChild.classList.contains('on'), true);
  let sheet = dsl`#app { class-toggle: on ${false}; }`;
  sheet.update(root);
  assert.equal(root.firstElementChild.classList.contains('on'), false);
});