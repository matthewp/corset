import sheet, { mount } from '../src/main.js';

QUnit.module('Property - store-root, store-set');

QUnit.test('Sets the root location of a store', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;
  let bindings = sheet`
    #app {
      store-root: app;
      store-set: app foo bar;
      text: store-get(app, foo);
    }
  `;
  bindings.update(root);
  assert.equal(root.firstElementChild.textContent, 'bar');
});

QUnit.test('Are accessible with JS; setting values in JS updates the mountpoint', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"><div class="child"><button></button></div><div class="sibling"></div></div>`;
  let change;
  mount(root, class {
    constructor(props, { stores }) {
      change = () => stores.get('app')?.set('name', 'Matthew');
    }
    bind(props, { stores }) {
      return sheet`
        #app {
          --app: "testing";
          store-root: app;
        }

        .child {
          store-set: app name "Wilbur";
        }

        .child button {
          event[some-event]: ${() => stores.get('app')?.set('name', 'Anne')};
        }

        .sibling {
          text: store-get(app, name);
        }
      `;
    }
  });
  change();
  assert.equal(root.querySelector('.sibling').textContent, 'Matthew');
  root.querySelector('.child button').dispatchEvent(new CustomEvent('some-event'));
  assert.equal(root.querySelector('.sibling').textContent, 'Anne');
});