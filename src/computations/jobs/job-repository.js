import *  as _ from 'lodash'
import {JobKeyGenerator} from "./job-key-generator";
import {JobInstance} from "./domain/job-instance";
import {Utils} from "../../utils";
import {JobExecution} from "./domain/job-execution";
import {JobExecutionAlreadyRunningException} from "./domain/exceptions/job-execution-already-running-exception";
import {JOB_STATUS} from "./domain/job-status";
import {JobInstanceAlreadyCompleteException} from "./domain/exceptions/job-instance-already-complete-exception";
import {ExecutionContext} from "./domain/execution-context";

export class JobRepository {

    jobs = [];
    jobByName = {};

    jobInstancesByKey = {};


    jobExecutions = [];
    stepExecutions = [];

    registerJob(job) {
        this.jobs.push(job);
        this.jobByName[job.name] = job;
    }

    getJobByName(name) {
        return this.jobByName[name];
    }


    /*Check if an instance of this job already exists with the parameters provided.*/
    isJobInstanceExists(jobName, jobParameters) {
        return !!this.getJobInstance(jobName, jobParameters);
    }

    generateJobInstanceKey(jobName, jobParameters) {
        return jobName + "|" + JobKeyGenerator.generateKey(jobParameters);
    }

    getJobInstance(jobName, jobParameters) {
        var key = this.generateJobInstanceKey(jobName, jobParameters);
        return this.jobInstancesByKey[key];
    }

    /*Create a new JobInstance with the name and job parameters provided.*/
    createJobInstance(jobName, jobParameters) {
        var key = this.generateJobInstanceKey(jobName, jobParameters);
        var jobInstance = new JobInstance(Utils.guid(), jobName)
        this.jobInstancesByKey[key] = jobInstance;
        return jobInstance;
    }

    findJobExecutions(jobInstance) {
        return _.find(this.jobExecutions, e=>e.jobInstance.id == jobInstance.id).sort(function (a, b) {
            return new a.createTime.getTime() - b.createTime.getTime()
        });
    }

    /*Create a JobExecution for a given  Job and JobParameters. If matching JobInstance already exists,
     * the job must be restartable and it's last JobExecution must *not* be
     * completed. If matching JobInstance does not exist yet it will be  created.*/

    createJobExecution(jobName, jobParameters) {
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
            executionContext = new ExecutionContext();
        }

        var jobExecution = new JobExecution(jobInstance, jobParameters);
        jobExecution.executionContext = executionContext;
        jobExecution.lastUpdated = new Date();
        this.jobExecutions.push(jobExecution);
        return jobExecution;
    }

    getLastJobExecution(jobName, jobParameters) {
        var jobInstance = this.getJobInstance(jobName, jobParameters);
        if(!jobInstance){
            return null;
        }

        return this.getLastJobExecutionByInstance(jobInstance)
    }

    getLastJobExecutionByInstance(jobInstance){

        var executions = this.findJobExecutions(jobInstance);
        return executions[executions.length -1]
    }

    getLastStepExecution(jobInstance, stepName) {
        var jobExecutions = this.findJobExecutions(jobInstance);
        var stepExecutions=[];
        jobExecutions.forEach(jobExecution=>jobExecution.stepExecutions.filter(s=>s.name === stepName).forEach(stepExecutions.push));
        var latest = null;
        stepExecutions.forEach(s=>{
            if (latest == null || latest.startTime.getTime() < s.startTime.getTime()) {
                latest = s;
            }
        });
        return latest;
    }

    addStepExecution(stepExecution) {
        stepExecution.lastUpdated = new Date();
        this.stepExecutions.push(stepExecution);
    }

    update(o){
        o.lastUpdated = new Date();
    }
}
