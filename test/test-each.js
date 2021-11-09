import dsl from '../src/dsl.js';

QUnit.module('Property - each');

QUnit.skip('Long form', assert => {
  let root = document.createElement('main');
  root.innerHTML = `<ul></ul><template id="todos-template"><li><span class="label"></span></li></template>`;

  let todos = [{label: 'walk the dog'}, {label: 'clean the dishes'}];
  let sheet = dsl`
    ul {
      each-items: ${todos};
      each-template: select(#todos-template);
      each-var: --todo;
    }

    .label {
      text: get(var(--todo), label);
    }
  `;
  sheet.update(root);
});