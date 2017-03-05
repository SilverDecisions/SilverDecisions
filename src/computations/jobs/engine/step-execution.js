import {Utils} from "sd-utils";
import {ExecutionContext} from "./execution-context";
import {JOB_STATUS} from "./job-status";
import {JobExecution} from "./job-execution";
import * as _ from "lodash";
/*
 representation of the execution of a step
 */
export class StepExecution {
    id;
    stepName;
    jobExecution;

    status = JOB_STATUS.STARTING;
    exitStatus = JOB_STATUS.EXECUTING;
    executionContext = new ExecutionContext(); //execution context for single step level,

    startTime = new Date();
    endTime = null;
    lastUpdated = null;

    terminateOnly = false; //flag to indicate that an execution should halt
    failureExceptions = [];

    constructor(stepName, jobExecution, id) {
        if(id===null || id === undefined){
            this.id = Utils.guid();
        }else{
            this.id = id;
        }

        this.stepName = stepName;
        this.jobExecution = jobExecution;
    }

    getJobParameters(){
        return this.jobExecution.jobParameters;
    }

    getJobExecutionContext(){
        return this.jobExecution.executionContext;
    }

    getData(){
        return this.executionContext.get("data");
    }

    getDTO(filteredProperties=[], deepClone = true){

        var cloneMethod = _.cloneDeepWith;
        if(!deepClone) {
            cloneMethod = _.cloneWith;
        }

        return _.assign({}, cloneMethod(this, (value, key, object, stack)=> {
            if(filteredProperties.indexOf(key)>-1){
                return null;
            }
            if(["executionContext"].indexOf(key)>-1){
                return value.getDTO()
            }
            if(value instanceof Error){
                return Utils.getErrorDTO(value);
            }

            if (value instanceof JobExecution) {
                return value.getDTO(["stepExecutions"], deepClone)
            }
        }))
    }
}
