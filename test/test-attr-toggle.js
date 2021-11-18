import dsl from '../src/dsl.js';

QUnit.module('Property - attr-toggle');

QUnit.test('Set an attribute value', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;

  function template(value) {
    return dsl`
      #app {
        attr-toggle: name ${value};
      }
    `;
  }

  template(true).update(root);
  assert.ok(root.firstElementChild.hasAttribute('name'));
  template(false).update(root);
  console.log(root);
  assert.ok(!root.firstElementChild.hasAttribute('name'));
});

QUnit.test('Can set multiple attributes', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;

  let sheet =dsl`
    #app {
      attr-toggle:
        one ${true}
        two ${true};
    }
  `;

  sheet.update(root);
  assert.ok(root.firstElementChild.hasAttribute('one'));
  assert.ok(root.firstElementChild.hasAttribute('two'));
});