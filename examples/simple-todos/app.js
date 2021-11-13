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
  deleteTodo(index) {
    app.todos.splice(index, 1);
    app.update();
  },
  toggleTodoDone(todo, ev) {
    todo.done = ev.target.checked;
    app.update();
  },
  updateTodoTitle(todo, ev) {
    todo.title = ev.target.value;
  },
  update() {
    let doneCount = app.todos.filter(t => t.done).length;
    let template = dsl`
      #new-todo {
        event: input ${app.setNewTitle};
        prop: value ${app.newTitle};
      }

      #create-todo {
        event: click ${app.createTodo};
      }

      #done-count {
        text: ${doneCount};
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
        event: change bind(${app.toggleTodoDone}, var(--todo));
      }

      .todo .title {
        prop: value var(--title);
        event: change bind(${app.updateTodoTitle}, var(--todo));
      }

      .todo .delete {
        data: index var(--index);
        event: click bind(${app.deleteTodo}, var(--index));
      }
    `;
    template.update(main);
  }
};

app.update();