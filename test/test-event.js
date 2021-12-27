import sheet from '../src/main.js';

QUnit.module('Property - event');

QUnit.test('Adds an event listener', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<button type="button"></button>`;
  let called = false;
  let cb = () => called = true;

  let bindings = sheet`button { event: click ${cb}; }`;
  bindings.update(root);
  root.firstElementChild.dispatchEvent(new Event('click'));
  assert.ok(called);
});

QUnit.test('Unbinds from previous callback when it changes', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<button type="button"></button>`;
  let count = 0;
  let cb = () => count++;

  function template() {
    return sheet`
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

QUnit.test('Can listen to multiple events on the same element', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<button type="button"></button>`;
  let count1 = 0, count2 = 0;
  let cb1 = () => count1++;
  let cb2 = () => count2++;

  let bindings = sheet`
    button {
      event:
        "custom-one" ${cb1}
        "custom-two" ${cb2};
    }
  `;


  bindings.update(root);
  root.firstElementChild.dispatchEvent(new Event('custom-one'));
  assert.equal(count1, 1);

  root.firstElementChild.dispatchEvent(new Event('custom-two'));
  assert.equal(count2, 1);
  assert.equal(count1, 1);
});