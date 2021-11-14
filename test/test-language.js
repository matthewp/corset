import dsl from '../src/dsl.js';

QUnit.module('Language');

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

QUnit.test('Comments are supported', assert => {
  let root = document.createElement('div');
  root.innerHTML = `<div id="app"></div>`;
  let sheet = dsl`
    #app {
      /* Setting the text here */
      text: "works";
    }
  `;
  sheet.update(root);
  assert.equal(root.firstElementChild.textContent, 'works');
});