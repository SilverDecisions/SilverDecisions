import * as _ from "lodash";
export class JobParameters{

    toString(){
        var result = "JobParameters[";
        _.forOwn(this, (value, key) => {
            result += key + "=" + value + ";";
        });
        result+="]"
        return result;
    }
}
