import sheet, { mount } from '../src/main.js';

QUnit.module('mount(el, cb)');

QUnit.test('Updates on state changes', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"><button type="button">Increment</button><span id="count"></span></div>`;

  mount(root, state => {
    const { count = 0 } = state;

    function increment() {
      state.count = count + 1;
    }

    return sheet`
      button {
        event: click ${increment};
      }

      #count {
        text: ${count};
      }
    `;
  });

  root.querySelector('button').dispatchEvent(new Event('click'));

  assert.equal(root.querySelector('#count').textContent, 1);
});