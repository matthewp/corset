import dsl from '../../src/dsl.js';

const root = document.querySelector('#app');

function createBox(root, data) {
  return {
    data,
    update() {
      let box = this.data;
      let count = box.count + 1;

      box.count = count;
      box.top = Math.sin(count / 10) * 10;
      box.left = Math.cos(count / 10) * 10;
      box.color = count % 255;
      box.content = count % 100;
      box.style = `top: ${box.top}px; left: ${box.left}px; background: rgb(0,0,${box.color});`;

      let sheet = dsl`
        .box {
          attr:
            style get(style);
          text: get(content);
        }
      `;
      sheet.update(root);
    }
  };
}


const app = {
  render() {
    let items = Array.from({length: 100}, (_, i) => ({
      id: `box-${i}`,
      number: i,
      count: 0,
      top: 0,
      left: 0,
      content: 0,
      style: ''
    }));

    let sheet = dsl`
      #boxes {
        each-items: ${items};
        each-template: select(template);
      }

      .box {
        attr:
          style get(style);
        text: get(content);
      }
    `;
    sheet.update(root);

    let roots = Array.from(root.querySelectorAll('.box-view'));
    app.boxes = roots.map((el, i) => createBox(el, items[i]));
    for(let box of app.boxes) {
      box.update();
    }
  },
  update() {
    for(let box of app.boxes) {
      box.update();
    }
  }
};
  
app.render();

var run = function(){
  app.update();
};

document.querySelector("#start").onclick = () => {
  loopCount = 0;
  totalTime = 0;
  console.profile("loops");
  benchmarkLoop(run);
};

window.timeout = null;
window.totalTime = null;
window.loopCount = null; 	
window.benchmarkLoop = (fn) => {
  let startDate = new Date();
  fn();
  let endDate = new Date();
  totalTime += endDate - startDate;
  loopCount++;
  if (loopCount % 100 === 0) {
    document.querySelector('#timing').textContent = `Performed ${loopCount} iterations in ${totalTime} ms (average ${(totalTime / loopCount).toFixed(2)} ms per loop).`;
  }

  if(loopCount < 1000) {
    timeout = setTimeout(() => {
      benchmarkLoop(fn);
    }, 1);
  } else {
    console.profileEnd("loops");
  }
};