import sheet from '../src/main.js';

QUnit.module('Property - attr');

QUnit.test('Set an attribute value', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;

  let bindings = sheet`
    #app {
      attr: name ${'world'};
    }
  `;

  bindings.update(root);
  assert.equal(root.firstElementChild.getAttribute('name'), 'world');
});

QUnit.test('Can set multiple attributes', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"><table></table></div>`;
  let bindings = sheet`
    table {
      attr:
        id "my-table"
        class "flat";
    }
  `;
  bindings.update(root);
  let table = root.querySelector('table');
  assert.equal(table.id, 'my-table');
  assert.equal(table.className, 'flat');
});