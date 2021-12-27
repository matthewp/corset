import sheet from '../src/main.js';

QUnit.module('Cascade');

QUnit.test('When a rule becomes non-matching the original value is restored', assert => {
  let root = document.createElement('main');
  root.innerHTML = /* html */ `
    <div id="app" class="on">original</div>
  `;
  function template(show) {
    return sheet`
      #app {
        class-toggle: on ${show};
      }

      #app.on {
        text: ${'shown'};
      }
    `;
  }
  template(true).update(root);
  assert.equal(root.firstElementChild.textContent, 'shown');
  template(false).update(root);
  assert.equal(root.firstElementChild.textContent, 'original');
});