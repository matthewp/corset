import sheet, { mount } from '../../../../lib/main';

mount(document, class {
    bind() {
        return sheet`
            body {
                text: "Hello world";
            }
        `;
    }
}, new Map);