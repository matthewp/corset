import sheet from '../src/main.js';

QUnit.module('Property - text');

QUnit.test('Sets the textContent if an element', assert => {
  let root = document.createElement('main');
  root.innerHTML = `
    <div class="foo"></div>
  `;

  let bindings = sheet`
    .foo { text: ${'bar'}; }
  `;

  bindings.update(root);
  assert.equal(root.firstElementChild.textContent, 'bar');
});

QUnit.test("Providing multiple values results in them being joined", assert => {
  let root = document.createElement('main');
  root.innerHTML = `<div id="app"><div id="one"></div><div id="two"></div></div>`;
  sheet`
    #app {
      --val: "three" "four";
    }

    #one {
      text: "one" "two";
    }

    #two {
      text: var(--val);
    }
  `.update(root);
  assert.equal(root.querySelector('#one').textContent, 'onetwo');
  assert.equal(root.querySelector('#two').textContent, 'threefour');
})