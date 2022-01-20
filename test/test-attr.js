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
        id "my-table",
        class "flat";
    }
  `;
  bindings.update(root);
  let table = root.querySelector('table');
  assert.equal(table.id, 'my-table');
  assert.equal(table.className, 'flat');
});

QUnit.only('Keyed attribute long-form', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<input>`;
  let bindings = sheet`
    input {
      attr-value[type]: "text";
      attr-toggle[disabled]: ${true};
    }
  `;
  bindings.update(root);
  let input = root.querySelector('input');
  assert.equal(input.getAttribute('type'), 'text');
  assert.ok(input.hasAttribute('disabled'));
  assert.equal(input.getAttribute('disabled'), '');
});