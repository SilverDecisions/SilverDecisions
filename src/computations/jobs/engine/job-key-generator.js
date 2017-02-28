import *  as _ from 'lodash'

export class JobKeyGenerator {
    /*Method to generate the unique key used to identify a job instance.*/
    static generateKey(jobParameters) {
        var result = "";
        jobParameters.definitions.forEach((d, i)=> {
            if(d.identifying){
                result += d.name + "=" + jobParameters.values[d.name] + ";";
            }
        });
        return result;
    }
}
