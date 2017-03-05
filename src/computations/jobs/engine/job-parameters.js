import * as _ from "lodash";
import {PARAMETER_TYPE} from "./job-parameter-definition";
import {Utils} from "sd-utils";
export class JobParameters{
    definitions = [];
    values={};

    constructor(values){
        this.initDefinitions();
        this.initDefaultValues();
        if (values) {
            Utils.deepExtend(this.values, values);
        }
    }

    initDefinitions(){

    }

    initDefaultValues(){

    }

    validate(){
        return this.definitions.every((def, i)=>def.validate(this.values[def.name]));
    }

    /*get or set value by path*/
    value(path, value){
        if (arguments.length === 1) {
            return  _.get(this.values, path, null);
        }
        _.set(this.values, path, value);
        return value;
    }

    toString(){
        var result = "JobParameters[";

        this.definitions.forEach((d, i)=> {

            var val = this.values[d.name];
            // if(Utils.isArray(val)){
            //     var values = val;
            //
            //
            // }
            // if(PARAMETER_TYPE.COMPOSITE == d.type){
            //
            // }

            result += d.name + "="+val + ";";
        });
        result+="]";
        return result;
    }

    getDTO(){
        return {
            values: this.values
        }
    }
}
