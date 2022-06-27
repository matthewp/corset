import sheet from '../src/main.js';

QUnit.module('Property - attr-toggle');

QUnit.skip('Set an attribute value', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;

  function template(value) {
    return sheet`
      #app {
        attr-toggle[name]: ${value};
      }
    `;
  }

  template(true).update(root);
  assert.ok(root.firstElementChild.hasAttribute('name'));
  template(false).update(root);
  assert.ok(!root.firstElementChild.hasAttribute('name'));
});

QUnit.skip('Can set multiple attributes', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;

  let bindings =sheet`
    #app {
      attr-toggle[one]: ${true};
      attr-toggle[two]: ${true};
    }
  `;

  bindings.update(root);
  assert.ok(root.firstElementChild.hasAttribute('one'));
  assert.ok(root.firstElementChild.hasAttribute('two'));
});

QUnit.skip('Source order is preferred', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;
  function run() {
    return sheet`
      #app {
        attr-value[one]: one;
        attr-toggle[one]: ${false};
      }

      #app {
        attr-toggle[one]: ${true};
      }
    `;
  }
  run().update(root);
  let app = root.firstElementChild;
  assert.equal(app.getAttribute('one'), 'one');
});