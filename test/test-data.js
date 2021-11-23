import dsl from '../src/dsl.js';

QUnit.module('Property - data');

QUnit.test('Sets a data property', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;

  let sheet = dsl`
    #app {
      data: name ${'world'};
    }
  `;

  sheet.update(root);
  assert.equal(root.firstElementChild.dataset.name, 'world');
});

QUnit.test('Can set multiple properties', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;

  let sheet = dsl`
    #app {
      data:
        firstOne "one"
        secondOne "two";
    }
  `;

  sheet.update(root);
  assert.equal(root.firstElementChild.dataset.firstOne, 'one');
  assert.equal(root.firstElementChild.dataset.secondOne, 'two');
});