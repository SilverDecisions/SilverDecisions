import * as log from "../../../log"
import {JOB_STATUS} from "./job-status";
import {JobInterruptedException} from "./exceptions/job-interrupted-exception";
import {JobParametersInvalidException} from "./exceptions/job-parameters-invalid-exception";
import {JobDataInvalidException} from "./exceptions/job-data-invalid-exception";
/*Base class for jobs*/
//A Job is an entity that encapsulates an entire job process ( an abstraction representing the configuration of a job).

export class Job {

    id;
    name;
    steps = [];

    isRestartable;
    executionListeners = [];
    jobParametersValidator;

    jobRepository;

    constructor(name, jobRepository) {
        this.name = name;
        this.jobParametersValidator = this.getJobParametersValidator();
        this.jobDataValidator = this.getJobDataValidator();
        this.jobRepository = jobRepository;
    }

    setJobRepository(jobRepository) {
        this.jobRepository = jobRepository;
    }

    execute(execution) {
        log.debug("Job execution starting: ", execution);
        return Promise.resolve(execution).then(execution=>{
            if (this.jobParametersValidator && !this.jobParametersValidator.validate(execution.jobParameters)) {
                throw new JobParametersInvalidException("Invalid job parameters in job execute")
            }

            if(this.jobDataValidator && !this.jobDataValidator.validate(execution.getData())){
                throw new JobDataInvalidException("Invalid job data in job execute")
            }

            if (execution.status === JOB_STATUS.STOPPING) {
                // The job was already stopped
                execution.status = JOB_STATUS.STOPPED;
                execution.exitStatus = JOB_STATUS.COMPLETED;
                log.debug("Job execution was stopped: " + execution);
                return execution;
            }

            execution.startTime = new Date();
            this.updateStatus(execution, JOB_STATUS.STARTED);
            this.executionListeners.forEach(listener=>listener.beforeJob(execution));

            return this.doExecute(execution);

        }).then(execution=>{
            log.debug("Job execution complete: ",execution);
            return execution
        }).catch(e=>{
            if (e instanceof JobInterruptedException) {
                log.info("Encountered interruption executing job", e);
                execution.status = JOB_STATUS.STOPPED;
                execution.exitStatus = JOB_STATUS.STOPPED;
            } else {
                log.error("Encountered fatal error executing job", e);
                execution.status = JOB_STATUS.FAILED;
                execution.exitStatus = JOB_STATUS.FAILED;
            }
            execution.failureExceptions.push(e);
            return execution;
        }).then(execution=>{
            execution.endTime = new Date();

            try {
                this.executionListeners.forEach(listener=>listener.afterJob(execution));
            } catch (e) {
                log.error("Exception encountered in afterStep callback", e);
            }
            this.jobRepository.update(execution);
            return execution;
        });
    }

    updateStatus(jobExecution, status) {
        jobExecution.status=status;
        this.jobRepository.update(jobExecution);
    }

    /* Extension point for subclasses allowing them to concentrate on processing logic and ignore listeners, returns promise*/

    doExecute(execution) {
        throw 'doExecute function not implemented for job: ' + this.name
    }

    getJobParametersValidator() {
        return {
            validate: (params) => true
        }
    }

    getJobDataValidator() {
        return {
            validate: (data) => true
        }
    }

    addStep(step){
        this.steps.push(step);
    }


    createJobParameters(values){
        throw 'createJobParameters function not implemented for job: ' + this.name
    }


    /*Should return progress in percents (integer)*/
    getProgress(execution){
        throw 'getProgress function not implemented for job: ' + this.name
    }

    registerExecutionListener(listener){
        this.executionListeners.push(listener);
    }
}
