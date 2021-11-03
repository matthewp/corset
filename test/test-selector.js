import dsl from '../src/dsl.js';

QUnit.module('Selectors');

QUnit.test('Attribute selectors work', assert => {
  let root = document.createElement('div');
  root.innerHTML = `<div foo></div>`;
  let sheet = dsl`
    [foo] {
      text: ${'works'};
    }
  `;
  sheet.update(root);
  assert.equal(root.firstElementChild.textContent, 'works');
});