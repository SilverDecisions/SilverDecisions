import {DisplayMode} from "../display-mode";

export class JobsManager  extends DisplayMode{
    static $MODE_NAME = 'job';

    jobs = [];
    jobByName = {};



    constructor(data, expressionEngine){
        super(JobsManager.$MODE_NAME);
        this.data = data;
        this.expressionEngine = expressionEngine;
    }

    registerJob(job){
        this.jobs.push(job);
        this.jobByName[job.name] = operation;
    }


    getJobByName(name){
        return this.jobByName[name];
    }


    getLastStepExecution(jobInstance, stepName){

    }
    addStepExecution(stepExecution){

    }
}
