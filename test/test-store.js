import sheet from '../src/main.js';

QUnit.module('Property - store-root');

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
  console.log(root);
  assert.equal(root.firstElementChild.textContent, 'bar');
});