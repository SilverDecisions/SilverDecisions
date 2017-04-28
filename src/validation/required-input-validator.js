import {Utils} from "sd-utils";

export class RequiredInputValidator {

    constructor() {
    }

    validate(value) {
        if (value === null || value === undefined) {
            return false;
        }
        value += "";
        return !!value.trim();
    }

}
