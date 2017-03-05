import {JOB_STATUS} from "./job-status";
import {StepExecution} from "./step-execution";
import {Utils} from "sd-utils";
import {ExecutionContext} from "./execution-context";
import * as _ from "lodash";
/*domain object representing the execution of a job.*/
export class JobExecution {
    id;
    jobInstance;
    jobParameters;
    stepExecutions = [];
    status = JOB_STATUS.STARTING;
    exitStatus = JOB_STATUS.UNKNOWN;
    executionContext = new ExecutionContext();

    startTime = null;
    createTime = new Date();
    endTime = null;
    lastUpdated = null;

    failureExceptions = [];

    constructor(jobInstance, jobParameters, id) {
        if(id===null || id === undefined){
            this.id = Utils.guid();
        }else{
            this.id = id;
        }

        this.id = Utils.guid();
        this.jobInstance = jobInstance;
        this.jobParameters = jobParameters;
    }

    /**
     * Register a step execution with the current job execution.
     * @param stepName the name of the step the new execution is associated with
     */
    createStepExecution(stepName) {
        var stepExecution = new StepExecution(stepName, this);
        this.stepExecutions.push(stepExecution);
        return stepExecution;
    }

    isRunning() {
        return !this.endTime;
    }

    /**
     * Test if this JobExecution has been signalled to
     * stop.
     */
    isStopping() {
        return this.status === JOB_STATUS.STOPPING;
    }

    /**
     * Signal the JobExecution to stop.
     */
    stop() {
        this.stepExecutions.forEach(se=> {
            se.terminateOnly = true;
        });
        this.status = JOB_STATUS.STOPPING;
    }

    getData() {
        return this.executionContext.getData();
    }

    getResult() {
        return this.executionContext.get("result");
    }

    getDTO(filteredProperties = [], deepClone = true) {
        var cloneMethod = _.cloneDeepWith;
        if (!deepClone) {
            cloneMethod = _.cloneWith;
        }

        return _.assign({}, cloneMethod(this, (value, key, object, stack)=> {
            if (filteredProperties.indexOf(key) > -1) {
                return null;
            }

            if (["jobParameters", "executionContext"].indexOf(key) > -1) {
                return value.getDTO()
            }
            if (value instanceof Error) {
                return Utils.getErrorDTO(value);
            }

            if (value instanceof StepExecution) {
                return value.getDTO(["jobExecution"], deepClone)
            }
        }))
    }
}
