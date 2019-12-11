/**
 * Input is responsible for the #grid-input element
 */

class Input {
    
    current_value = "";

    constructor() {
        this.elem = $('#grid-input');
    }

    getValue() {
        this.current_value = this.elem.val();
        return this.current_value;
    }

    hasValueChanged() {
        return this.current_value != this.elem.val();
    }

    setValue(string) {
        this.current_value = string;
        this.elem.val(this.current_value);
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