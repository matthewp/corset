// this is just an experiment

function registerBehavior(name, controller) {

}

registerBehavior('dragAndDrop', class {
  static inputProperties = ['--drop-class', '--drop-target'];

  render(element, properties, values, update) {
    let className = properties.get('--drop-class', values);
    let dragging = false;

    const ondragstart = () => {

    };

    sheet`
      #app {
        behavior: mount(dragAndDrop);
      }

      ${element} {
        event[dragstart]: ${ondragstart};

        class[--drop-class]: ${dragging};
      }
    `

    element.addEventListener('dragstart', () => {

    });
    
  }
});