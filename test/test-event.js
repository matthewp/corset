import dsl from '../src/dsl.js';

QUnit.module('Property - event');

QUnit.test('Adds an event listener', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<button type="button"></button>`;
  let called = false;
  let cb = () => called = true;

  let sheet = dsl`button { event: click ${cb}; }`;
  sheet.update(root);
  root.firstElementChild.dispatchEvent(new Event('click'));
  assert.ok(called);
});

QUnit.test('Unbinds from previous callback when it changes', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<button type="button"></button>`;
  let count = 0;
  let cb = () => count++;

  function template() {
    return dsl`
      button {
        --cb: ${cb.bind(null)};
        event: click var(--cb); 
      }
    `;
  }


  template().update(root);
  root.firstElementChild.dispatchEvent(new Event('click'));
  assert.equal(count, 1);

  template().update(root);
  root.firstElementChild.dispatchEvent(new Event('click'));
  assert.equal(count, 2);
});

QUnit.skip('Can listen to multiple events on the same element');