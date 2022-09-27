import sheet, { mount } from '../../src/main.js';

const getSecondsSinceMidnight = () => (Date.now() - new Date().setHours(0, 0, 0, 0)) / 1000;
const rotateFixed = (index, length) => `rotate(${(360 * index) / length})`;
const rotateDyn = (rotate, fixed = 1) => `rotate(${(rotate * 360).toFixed(fixed)})`;

mount(document, class {
  time = getSecondsSinceMidnight();

  bind() {
    return sheet`
      .lines {
        --rotate: ${rotateFixed};
      }

      .dyn {
        --rotate: ${rotateDyn};
      }

      .hours {
        each-template: select(#hand-tmpl);
        each-items: ${new Array(12)};
        --num-of-lines: 12;
        --length: 5;
        --width: 2;
      }

      .subseconds {
        each-template: select(#hand-tmpl);
        each-items: ${new Array(60)};
        --num-of-lines: 60;
        --length: 2;
        --width: 1;
      }

      .lines line {
        --rotation: --rotate(index(), var(--num-of-lines));
        class-toggle: fixed true;
      }

      .hand.dyn {
        attach-template: select(#hand-tmpl);
      }

      .hour {
        --rotation: --rotate(${((this.time / 60 / 60) % 12) / 12}); 
        --length: 50;
        --width: 4;
      }

      .minute {
        --rotation: --rotate(${((this.time / 60) % 60) / 60}); 
        --length: 70;
        --width: 3;
      }

      .second {
        --rotation: --rotate(${(this.time % 60) / 60});
        --length: 80;
        --width: 2;
      }

      .subsecond {
        --rotation: --rotate(${this.time % 1});
        --length: 85;
        --width: 5;
      }
       
      line {
        attr:
          stroke-width var(--width),
          transform var(--rotation);
      }

      line.fixed {
        attr:
          y1 get(var(--length), ${len => len - 95}),
          y2 ${-95};
      }

      line:not(.fixed) {
        attr: y2 var(--length);
      }
    `;
  }
});