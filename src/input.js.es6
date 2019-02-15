/**
 * Input is responsible for the #grid-input element
 */

class Input {
    constructor() {
        this.elem = $('#grid-input');
    }

    getValue() {
        return this.elem.val();
    }

    setValue(string) {
        this.elem.val(string);
    }

    clear() {
        this.elem.val('').select();
    }

    focus() {
        this.elem.select();
    }

    blur() {
        this.elem.blur();
    }

    changePlaceholder(string) {
        this.elem.attr('placeholder', string);
    }
}