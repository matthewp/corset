import dsl from '../src/dsl.js';

QUnit.module('Property - attr');

QUnit.test('Set an attribute value', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;

  let sheet = dsl`
    #app {
      attr: name ${'world'};
    }
  `;

  sheet.update(root);
  assert.equal(root.firstElementChild.getAttribute('name'), 'world');
});