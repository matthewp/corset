import dsl from '../../src/dsl.js';
import { fetchUserName } from './api.js';

let main = document.querySelector('main');

let app = {
  emailError: '',
  passwordError: '',
  confirmpasswordError: '',
  onSubmit(ev) {
    ev.preventDefault();
    console.log('Done');
  },
  async validateField(customValidator, errorProp, ev) {
    let el = ev.target;
    el.setCustomValidity('');
    el.checkValidity();
    let message = el.validationMessage;
    if(!message) {
      message = customValidator ? await customValidator(el) : null;
      el.setCustomValidity(message);
    }
    app[errorProp] = message || '';
    app.update();
  },
  clearError(errorProp) {
    app[errorProp] = '';
    app.update();
  },
  async emailValidator(el) {
    if(await fetchUserName(el.value)) {
      return `${el.value} is already in use.`;
    }
  },
  passwordMatchValidator(el) {
    if(el.value !== document.querySelector('input[id=password]').value) {
      return `Passwords do not match.`
    }
  },
  update() {
    let sheet = dsl`
      form {
        event: submit ${app.onSubmit};
      }

      .field-block {
        class-toggle: "field-has-error" get(${app}, var(--error-prop));
      }

      .field-block-email {
        --validator: ${app.emailError};
        --error-prop: "emailError";
      }

      .field-block-password {
        --error-prop: "passwordError";
      }

      .field-block-confirmpassword {
        --validator: ${app.passwordMatchValidator};
        --error-prop: "confirmpasswordError";
      }

      input {
        --field-validation: bind(${app.validateField}, var(--validator), var(--error-prop));
        event:
          blur var(--field-validation)
          input bind(${app.clearError}, var(--error-prop));
      }

      .field-has-error .errors {
        attach-template: select(#error-tmpl);
      }

      .field-has-error .error-message {
        text: get(${app}, var(--error-prop));
      }
    `;
    sheet.update(main);
  }
};

app.update();