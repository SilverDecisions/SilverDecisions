import {Utils} from "../../../utils";
/*
representation of the execution of a step
*/
export class StepExecution{
    id;
    stepName;
    jobExecution;

    startTime = new Date();
    endTime = null;
    lastUpdated = null;

    terminateOnly = false; //flag to indicate that an execution should halt

    constructor(stepName, jobExecution){
        this.id = Utils.guid();
        this.stepName = stepName;
        this.jobExecution = jobExecution;
    }
}
