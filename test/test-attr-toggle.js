import dsl from '../src/dsl.js';

QUnit.module('Property - attr-toggle');

QUnit.test('Set an attribute value', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;

  function template(value) {
    return dsl`
      #app {
        attr-toggle: name ${true};
      }
    `;
  }

  template(true).update(root);
  assert.ok(root.firstElementChild.hasAttribute('name'));
});