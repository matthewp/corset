import dsl from '../src/dsl.js';

QUnit.module('text');

QUnit.test('Sets the textContent if an element', assert => {
  let root = document.createElement('main');
  root.innerHTML = `
    <div class="foo"></div>
  `;

  let sheet = dsl`
    .foo { text: ${'bar'}; }
  `;

  sheet.update(root);
  assert.equal(root.firstElementChild.textContent, 'bar');
});