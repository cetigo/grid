'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Input is responsible for the #grid-input element
 */

var Input = function () {
    function Input() {
        _classCallCheck(this, Input);

        this.elem = $('#grid-input');
    }

    _createClass(Input, [{
        key: 'getValue',
        value: function getValue() {
            return this.elem.val();
        }
    }, {
        key: 'setValue',
        value: function setValue(string) {
            this.elem.val(string);
        }
    }, {
        key: 'clear',
        value: function clear() {
            this.elem.val('').select();
        }
    }, {
        key: 'focus',
        value: function focus() {
            this.elem.select();
        }
    }, {
        key: 'blur',
        value: function blur() {
            this.elem.blur();
        }
    }, {
        key: 'changePlaceholder',
        value: function changePlaceholder(string) {
            this.elem.attr('placeholder', string);
        }
    }]);

    return Input;
}();
