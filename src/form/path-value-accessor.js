import {Utils} from "sd-utils";

export class PathValueAccessor {
    sourceObject;
    path;
    constructor(sourceObject, path){
        this.sourceObject=sourceObject;
        this.path = path;
    }

    get(){
        return Utils.get(this.sourceObject, this.path);
    }

    set(v){
        return Utils.set(this.sourceObject, this.path, v);
    }
}
