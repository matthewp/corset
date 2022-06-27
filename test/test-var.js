import sheet from '../src/main.js';

QUnit.module('Macro - var()');

QUnit.skip('Can pass multiple values to a property', assert => {
  assert.expect(3);
  let root = document.createElement('main');
  root.innerHTML = `
    <div id="app"><ul id="colors"></ul></div>
    <template><li><span class="color"></span></li></template>
  `;
  let colors = ['red', 'blue', 'yellow'].map((c, i) => ({ name: c, id: i }));
  let bindings = sheet`
    #app {
      --opts: ${colors} select(template) "id";
    }

    #colors {
      each: var(--opts);
    }

    .color {
      text: get(item(), "name");
    }
  `;
  bindings.update(root);
  let lis = root.querySelectorAll('li');
  let i = 0;
  while(i < colors.length) {
    let colorName = colors[i].name;
    assert.equal(lis[i].querySelector('.color').textContent, colorName);
    i++;
  }
});