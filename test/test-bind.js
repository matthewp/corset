import dsl from '../src/dsl.js';

QUnit.module('Function - bind()');

QUnit.test('Can bind arguments to a function', assert => {
  assert.expect(2);
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"><button type="button"></button></div>`;
  let data = {type: 'data'};
  let second = {type: 'second'};
  let callback = (arg1, arg2) => {
    assert.equal(arg1, data);
    assert.equal(arg2, second);
  };
  let sheet = dsl`
    button {
      --data: ${data};
      --second: ${second};
      event: click bind(${callback}, var(--data), var(--second));
    }
  `;
  sheet.update(root);
  root.querySelector('button').dispatchEvent(new Event('click'));
});