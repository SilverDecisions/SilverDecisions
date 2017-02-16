import *  as _ from 'lodash'

export class JobKeyGenerator {
    /*Method to generate the unique key used to identify a job instance.*/
    static generateKey(jobParameters) {
        var result = "";
        _.forOwn(jobParameters, (value, key) => {
            result += key + "=" + value + ";";
        });
        return result;
    }
}
