import sheet from '../src/main.js';

QUnit.module('Function - data()');

QUnit.test('Gets data from the element', assert => {
  assert.expect(1);
  let root = document.createElement('main');
  root.innerHTML = `<div id="app" data-foo="bar"><button type="button"></button></div>`;

  let cb = (value) => {
    assert.equal(value, 'bar');
  }

  let bindings = sheet`
    #app {
      --value: data(foo);
    }

    button {
      event: click bind(${cb}, var(--value));
    }
  `;

  bindings.update(root);
  root.querySelector('button').dispatchEvent(new Event('click'));
});