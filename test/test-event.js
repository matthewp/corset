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

QUnit.skip('Unbinds from previous callback when it changes', assert => {

});