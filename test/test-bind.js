import dsl from '../src/dsl.js';

QUnit.module('Function - bind()');

QUnit.test('Can bind arguments to a function', assert => {
  assert.expect(1);
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"><button type="button"></button></div>`;
  let data = {};
  let callback = (arg) => assert.equal(arg, data);
  let sheet = dsl`
    button {
      --data: ${data};
      event: click bind(${callback}, var(--data));
    }
  `;
  sheet.update(root);
  root.querySelector('button').dispatchEvent(new Event('click'));
});