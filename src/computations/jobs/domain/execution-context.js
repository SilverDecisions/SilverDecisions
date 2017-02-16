import *  as _ from 'lodash'

export class ExecutionContext {

    dirty = false;
    data = {};

    constructor(data) {
        if (data) {
            this.data = _.clone(data)
        }
    }

    put(key, value) {
        var prevValue = this.data[key];
        if (value != null) {
            var result = this.data[key] = value;
            this.dirty = prevValue == null || prevValue != null && prevValue != value;
        }
        else {
            delete this.data[key];
            this.dirty = prevValue != null;
        }
    }

    containsKey(key) {
        return this.data.hasOwnProperty(key);
    }

    remove(key) {
        delete this.data[key];
    }


}
