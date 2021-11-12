import dsl from '../../src/dsl.js';

let main = document.querySelector('main');

let app = {
  todos: [],
  newTitle: '',
  setNewTitle(ev) {
    app.newTitle = ev.target.value;
    app.update();
  },
  createTodo() {
    app.todos.push({
      title: app.newTitle,
      done: false
    });
    app.newTitle = '';
    app.update();
  },
  deleteTodo(ev) {
    let index = Number(ev.target.value);
    app.todos.splice(index, 1);
    app.update();
  },
  update() {
    let template = dsl`
      #new-todo {
        event: input ${app.setNewTitle};
        prop: value ${app.newTitle};
      }

      #create-todo {
        event: click ${app.createTodo};
      }

      #todos {
        each-items: ${app.todos};
        each-template: select(#todo-template);
        each-scope: --todo;
        each-key: title;
      }

      .todo {
        --done: get(var(--todo), done);
        --title: get(var(--todo), title);
      }

      .todo .done {
        prop: checked var(--done);
      }

      .todo .title {
        prop: value var(--title);
      }

      .todo .delete {
        data: index var(--index);
        event: click ${app.deleteTodo};
      }
    `;
    template.update(main);
  }
};

app.update();