import *  as _ from 'lodash'
import {JobKeyGenerator} from "../job-key-generator";
import {JobInstance} from "../job-instance";
import {Utils} from "../../../../utils";
import {JobExecution} from "../job-execution";
import {JobExecutionAlreadyRunningException} from "../exceptions/job-execution-already-running-exception";
import {JOB_STATUS} from "../job-status";
import {JobInstanceAlreadyCompleteException} from "../exceptions/job-instance-already-complete-exception";
import {ExecutionContext} from "../execution-context";
import {StepExecution} from "../step-execution";

export class JobRepository {

    jobByName = {};

    registerJob(job) {
        this.jobByName[job.name] = job;
    }

    getJobByName(name) {
        return this.jobByName[name];
    }


    /*returns promise*/
    getJobInstance(jobName, jobParameters) {
       throw "JobRepository getJobInstance function not implemented!"
    }

    /*should return promise that resolves to saved instance*/
    saveJobInstance(key, jobInstance){
        throw "JobRepository.saveJobInstance function not implemented!"
    }

    /*should return promise that resolves to saved jobExecution*/
    saveJobExecution(jobExecution){
        throw "JobRepository.saveJobInstance function not implemented!"
    }

    /*should return promise which resolves to saved stepExecution*/
    saveStepExecution(stepExecution){
        throw "JobRepository.saveStepExecution function not implemented!"
    }

    /*find job executions sorted by createTime, returns promise*/
    findJobExecutions(jobInstance) {
        throw "JobRepository.findJobExecutions function not implemented!"
    }

    /*Create a new JobInstance with the name and job parameters provided. return promise*/
    createJobInstance(jobName, jobParameters) {

        var jobInstance = new JobInstance(Utils.guid(), jobName);
        return this.saveJobInstance(jobInstance, jobParameters);
    }

    /*Check if an instance of this job already exists with the parameters provided.*/
    isJobInstanceExists(jobName, jobParameters) {
        return this.getJobInstance(jobName, jobParameters).then(result => !!result).catch(error=>false);
    }

    generateJobInstanceKey(jobName, jobParameters) {
        return jobName + "|" + JobKeyGenerator.generateKey(jobParameters);
    }


    /*Create a JobExecution for a given  Job and JobParameters. If matching JobInstance already exists,
     * the job must be restartable and it's last JobExecution must *not* be
     * completed. If matching JobInstance does not exist yet it will be  created.*/

    createJobExecution_(jobName, jobParameters, data) {
        var jobInstance = this.getJobInstance(jobName, jobParameters);

        var executionContext;
        // existing job instance found
        if (jobInstance != null) {
            var executions = this.findJobExecutions(jobInstance);
            executions.forEach(execution=> {
                if (execution.isRunning()) {
                    throw new JobExecutionAlreadyRunningException("A job execution for this job is already running: " + jobInstance.jobName);
                }
                if (execution.status == JOB_STATUS.COMPLETED || execution.status == JOB_STATUS.ABANDONED) {
                    throw new JobInstanceAlreadyCompleteException(
                        "A job instance already exists and is complete for parameters=" + jobParameters
                        + ".  If you want to run this job again, change the parameters.");
                }
            });
            executionContext = executions[executions.length - 1].executionContext;
        } else {
            // no job found, create one
            jobInstance = this.createJobInstance(jobName, jobParameters);
            executionContext = new ExecutionContext({
                data: data
            });
        }

        var jobExecution = new JobExecution(jobInstance, jobParameters);
        jobExecution.executionContext = executionContext;
        jobExecution.lastUpdated = new Date();
        this.jobExecutions.push(jobExecution);
        return jobExecution;
    }

    createJobExecution(jobName, jobParameters, data) {
        return this.getJobInstance(jobName, jobParameters).then(jobInstance=>{
            if (jobInstance != null) {
                return this.findJobExecutions(jobInstance).then(executions=>{
                    executions.forEach(execution=> {
                        if (execution.isRunning()) {
                            throw new JobExecutionAlreadyRunningException("A job execution for this job is already running: " + jobInstance.jobName);
                        }
                        if (execution.status == JOB_STATUS.COMPLETED || execution.status == JOB_STATUS.ABANDONED) {
                            throw new JobInstanceAlreadyCompleteException(
                                "A job instance already exists and is complete for parameters=" + jobParameters
                                + ".  If you want to run this job again, change the parameters.");
                        }
                    });
                    var executionContext = executions[executions.length - 1].executionContext;
                    return [jobInstance, executionContext];
                })
            }

            // no job found, create one
            jobInstance = this.createJobInstance(jobName, jobParameters);
            var executionContext = new ExecutionContext({
                data: data
            });

            return [jobInstance, executionContext];
        }).then(instanceAndExecutionContext=>{
            var jobExecution = new JobExecution(instanceAndExecutionContext[0], jobParameters);
            jobExecution.executionContext = instanceAndExecutionContext[1];
            jobExecution.lastUpdated = new Date();
            this.jobExecutions.push(jobExecution);
            return this.saveJobExecution(jobExecution);
        }).catch(e=>{
            throw e;
        })
    }


    getLastJobExecution(jobName, jobParameters) {
        return this.getJobInstance(jobName, jobParameters).then((jobInstance)=>{
            if(!jobInstance){
                return null;
            }
            return this.getLastJobExecutionByInstance(jobInstance);
        })
    }

    getLastJobExecutionByInstance(jobInstance){
        return this.findJobExecutions(jobInstance).then(executions=>executions[executions.length -1]);
    }

    getLastStepExecution(jobInstance, stepName) {
        return this.findJobExecutions(jobInstance).then(jobExecutions=>{
            var stepExecutions=[];
            jobExecutions.forEach(jobExecution=>jobExecution.stepExecutions.filter(s=>s.name === stepName).forEach(stepExecutions.push));
            var latest = null;
            stepExecutions.forEach(s=>{
                if (latest == null || latest.startTime.getTime() < s.startTime.getTime()) {
                    latest = s;
                }
            });
            return latest;
        })
    }

    addStepExecution(stepExecution) {
        stepExecution.lastUpdated = new Date();
        return this.saveStepExecution(stepExecution);
    }

    update(o){
        o.lastUpdated = new Date();

        if(o instanceof JobExecution){
            return this.saveJobExecution(o);
        }

        if(o instanceof StepExecution){
            return this.saveStepExecution(o);
        }

        throw "Object not updatable: "+o
    }
}
