import sheet, { registerCustomFunction } from '../src/main.js';

QUnit.module('registeryCustomFunction');

QUnit.test('Can register simple custom functions', assert => {
  registerCustomFunction('--add-one', class {
    call([a, b]) {
      return a + b;
    }
  });
  let root = document.createElement('main');
  root.innerHTML = `
    <div id="app"><span class="result"></span></div>
  `;
  let binding = sheet`
    .result {
      text: --add-one(${1}, ${2});
    }
  `;
  binding.update(root);
  let r = root.querySelector('.result');
  assert.equal(r.textContent, 3);
});

QUnit.test('Can use inputProperties', assert => {
  registerCustomFunction('--add-two', class {
    static inputProperties = ['--start'];
    call([a, b], _ctx, props) {
      return a + b + props.get('--start');
    }
  });
  let root = document.createElement('main');
  root.innerHTML = `
    <div id="app"><span class="result"></span></div>
  `;
  let binding = sheet`
    #app {
      --start: ${3};
    }

    .result {
      text: --add-two(${1}, ${2});
    }
  `;
  binding.update(root);
  let r = root.querySelector('.result');
  assert.equal(r.textContent, 6);
})