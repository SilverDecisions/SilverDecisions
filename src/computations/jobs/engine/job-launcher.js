import {JobRestartException} from "./exceptions/job-restart-exception";
import {JOB_STATUS} from "./job-status";
import * as log from "../../../log";
import {Utils} from "../../../utils";

export class JobLauncher {

    jobRepository;

    constructor(jobRepository) {
        this.jobRepository = jobRepository;
    }

    run(jobOrName, jobParametersValues, data) {
        var job;
        if(Utils.isString(jobOrName)){
            job = this.jobRepository.getJobByName(jobOrName)
        }else{
            job = jobOrName;
        }
        if(!job){
            throw new JobRestartException("No such job: "+jobOrName);
        }

        var jobParameters = job.createJobParameters(jobParametersValues);

        return this.jobRepository.getLastJobExecution(job.name, jobParameters).then(lastExecution=>{
            if (lastExecution != null) {
                if (!job.isRestartable) {
                    throw new JobRestartException("JobInstance already exists and is not restartable");
                }

                lastExecution.stepExecutions.forEach(execution=> {
                    if (execution.status == JOB_STATUS.UNKNOWN) {
                        throw new JobRestartException("Step [" + execution.stepName + "] is of status UNKNOWN");
                    }
                });
            }
            if (job.jobParametersValidator) {
                job.jobParametersValidator.validate(jobParameters);
            }

            return this.jobRepository.createJobExecution(job.name, jobParameters, data);
        }).then(jobExecution=>{
            log.info("Job: [" + job.name + "] launched with the following parameters: [" + jobParameters + "]");
            return job.execute(jobExecution)
        }).then(jobExecution=>{
            log.info("Job: [" + job.name + "] completed with the following parameters: [" + jobParameters + "] and the following status: [" + jobExecution.status + "]");
            return jobExecution;
        }).catch(e =>{
            log.error("Job: [" + job.name + "] failed unexpectedly and fatally with the following parameters: [" + jobParameters + "]", e);
            throw e;
        })
    }

    run_(jobOrName, jobParametersValues, data) {
        var job;
        if(Utils.isString(jobOrName)){
            job = this.jobRepository.getJobByName(jobOrName)
        }else{
            job = jobOrName;
        }
        if(!job){
            throw new JobRestartException("No such job: "+jobOrName);
        }

        var jobParameters = job.createJobParameters(jobParametersValues);

        var lastExecution = this.jobRepository.getLastJobExecution(job.name, jobParameters);
        if (lastExecution != null) {
            if (!job.isRestartable) {
                throw new JobRestartException("JobInstance already exists and is not restartable");
            }

            lastExecution.stepExecutions.forEach(execution=> {
                if (execution.status == JOB_STATUS.UNKNOWN) {
                    throw new JobRestartException("Step [" + execution.stepName + "] is of status UNKNOWN");
                }
            });
        }
        if (job.jobParametersValidator) {
            job.jobParametersValidator.validate(jobParameters);
        }
        var jobExecution = this.jobRepository.createJobExecution(job.name, jobParameters, data);

        ///////////// TODO run it in worker
        try {
            log.info("Job: [" + job.name + "] launched with the following parameters: [" + jobParameters + "]");
            job.execute(jobExecution);
            log.info("Job: [" + job.name + "] completed with the following parameters: [" + jobParameters + "] and the following status: [" + jobExecution.status + "]");
        }
        catch (e) {
            log.error("Job: [" + job.name + "] failed unexpectedly and fatally with the following parameters: [" + jobParameters + "]", e);
        }
        ////////////

        return jobExecution;
    }
}
