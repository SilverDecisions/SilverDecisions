import {Utils} from "sd-utils";

export class NumberInputValidator {

    constructor(min, max) {
        this.min = min;
        this.max = max;
    }

    validate(value) {
        if (value === null || value === undefined) {
            return false;
        }
        value += "";
        if (!value.trim()) {
            return false;
        }

        value = parseFloat(value);

        if (!Utils.isNumber(value)) {
            return false;
        }

        if (this.min !== undefined && value < this.min) {
            return false;
        }

        return !(this.max !== undefined && value > this.max);
    }

}
