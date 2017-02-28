import {JobRepository} from "./job-repository";

export class SimpleJobRepository extends JobRepository{
    jobInstancesByKey = {};
    jobExecutions = [];
    stepExecutions = [];

    /*returns promise*/
    getJobInstance(jobName, jobParameters) {
        var key = this.generateJobInstanceKey(jobName, jobParameters);
        return Promise.resolve(this.jobInstancesByKey[key]);
    }

    /*should return promise that resolves to saved instance*/
    saveJobInstance(jobInstance, jobParameters){
        var key = this.generateJobInstanceKey(jobInstance.jobName, jobParameters);
        this.jobInstancesByKey[key] = jobInstance;
        return Promise.resolve(jobInstance)
    }

    /*should return promise that resolves to saved jobExecution*/
    saveJobExecution(jobExecution){
        this.jobExecutions.push(jobExecution);
        return Promise.resolve(jobExecution);
    }

    /*should return promise which resolves to saved stepExecution*/
    saveStepExecution(stepExecution){
        this.stepExecutions.push(stepExecution);
        return Promise.resolve(stepExecution);
    }

    /*find job executions sorted by createTime, returns promise*/
    findJobExecutions(jobInstance) {
        return Promise.resolve(this.jobExecutions.filter(e=>e.jobInstance.id == jobInstance.id).sort(function (a, b) {
            return a.createTime.getTime() - b.createTime.getTime()
        }));
    }
}
