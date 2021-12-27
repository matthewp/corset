import sheet from '../src/main.js';

QUnit.module('Property - text');

QUnit.test('Sets the textContent if an element', assert => {
  let root = document.createElement('main');
  root.innerHTML = `
    <div class="foo"></div>
  `;

  let bindings = sheet`
    .foo { text: ${'bar'}; }
  `;

  bindings.update(root);
  assert.equal(root.firstElementChild.textContent, 'bar');
});