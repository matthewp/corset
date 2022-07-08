import sheet from '../src/main.js';

QUnit.module('Property - data');

QUnit.test('Sets a data property', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;

  let bindings = sheet`
    #app {
      data: name ${'world'};
    }
  `;

  bindings.update(root);
  assert.equal(root.firstElementChild.dataset.name, 'world');
});

QUnit.test('Can set multiple properties', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;

  let bindings = sheet`
    #app {
      data:
        firstOne "one",
        secondOne "two";
    }
  `;

  bindings.update(root);
  assert.equal(root.firstElementChild.dataset.firstOne, 'one');
  assert.equal(root.firstElementChild.dataset.secondOne, 'two');
});

QUnit.test('Changes cause selectors to update', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"></div>`;

  let bindings = sheet`
    #app {
      data: one "two";
    }

    [data-one=two] {
      class-toggle: works true;
    }
  `;
  bindings.update(root);
  assert.equal(root.firstElementChild.classList.contains('works'), true);
});