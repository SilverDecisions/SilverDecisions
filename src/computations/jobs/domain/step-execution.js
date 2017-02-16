import {Utils} from "../../../utils";
import {ExecutionContext} from "./execution-context";
import {JOB_STATUS} from "./job-status";
/*
 representation of the execution of a step
 */
export class StepExecution {
    id;
    stepName;
    jobExecution;

    status = JOB_STATUS.STARTING;
    exitStatus = JOB_STATUS.EXECUTING;
    executionContext = new ExecutionContext();

    startTime = new Date();
    endTime = null;
    lastUpdated = null;

    terminateOnly = false; //flag to indicate that an execution should halt
    failureExceptions = [];

    constructor(stepName, jobExecution) {
        this.id = Utils.guid();
        this.stepName = stepName;
        this.jobExecution = jobExecution;
    }
}
