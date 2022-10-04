import sheet from '../src/main.js';

QUnit.module('Selector - :root');

QUnit.test(':root selector targets the root element', assert => {
  let root = document.createElement('main');

  function template(value) {
    return sheet`
      :root {
        class-toggle: works ${value};
      }
    `;
  }

  template(true).update(root);
  assert.equal(root.classList.contains('works'), true);
  template(false).update(root);
  assert.equal(root.classList.contains('works'), false);
});

QUnit.only(':scope selector targets the root element', assert => {
  let root = document.createElement('main');

  function template(value) {
    return sheet`
      :scope {
        class-toggle: works ${value};
      }
    `;
  }

  template(true).update(root);
  console.log(root);
  assert.equal(root.classList.contains('works'), true);
  template(false).update(root);
  assert.equal(root.classList.contains('works'), false);
});