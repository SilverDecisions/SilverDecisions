import *  as _ from "lodash";

export class ExecutionContext {

    dirty = false;
    context = {};

    constructor(context) {
        if (context) {
            this.context = _.clone(context)
        }
    }

    put(key, value) {
        var prevValue = this.context[key];
        if (value != null) {
            var result = this.context[key] = value;
            this.dirty = prevValue == null || prevValue != null && prevValue != value;
        }
        else {
            delete this.context[key];
            this.dirty = prevValue != null;
        }
    }

    get(key) {
        return this.context[key];
    }

    containsKey(key) {
        return this.context.hasOwnProperty(key);
    }

    remove(key) {
        delete this.context[key];
    }

    setData(data) { //set data model
        return this.put("data", data);
    }

    getData() { // get data model
        return this.get("data");
    }

    getDTO() {
        var dto = _.cloneDeep(this);
        var data = this.getData();
        if (data) {
            data = data.getDTO();
            dto.context["data"] = data;
        }
        return dto;
    }

}
