import * as log from "../../../log"
import {JOB_STATUS} from "./job-status";
/*Base class for jobs*/
//A Job is an entity that encapsulates an entire job process ( an abstraction representing the configuration of a job).

export class Job {

    id;
    name;
    isRestartable;

    executionListeners = [];
    jobParametersValidator;

    jobRepository;
    setJobRepository(jobRepository){
        this.jobRepository = jobRepository;
    }


    constructor(name) {
        this.name = name;
    }

    execute(execution) {
        log.debug("Job execution starting: " + execution);

        try {
            if(this.jobParametersValidator){
                this.jobParametersValidator.validate(execution.jobParameters);
            }

            if (execution.status != JOB_STATUS.STOPPING) {

                execution.startTime = new Date();
                execution.status = JOB_STATUS.STARTED;

                this.executionListeners.forEach(listener=>listener.beforeJob(execution));

                try {
                    this.doExecute(execution);
                    log.debug("Job execution complete: " + execution);
                } catch (e) {
                    throw e;
                }
            } else {

                // The job was already stopped
                execution.status = JOB_STATUS.STOPPED;
                execution.exitStatus = JOB_STATUS.COMPLETED;
                log.debug("Job execution was stopped: " + execution);

            }

        } catch (e) {
            log.error("Encountered fatal error executing job", e);
            execution.status = JOB_STATUS.FAILED;
            execution.exitStatus = JOB_STATUS.FAILED;
            execution.failureExceptions.push(e);
        } finally {

            execution.endTime = new Date();

            try {
                this.executionListeners.forEach(listener=>listener.afterJob(execution));
                listener.afterJob(execution);
            } catch (e) {
                log.error("Exception encountered in afterStep callback", e);
            }

        }
    }

    /* Extension point for subclasses allowing them to concentrate on processing logic and ignore listeners*/

    doExecute(execution) {
        throw 'doExecute function not implemented for job: ' + this.name
    }

    getJobParametersValidator() {

    }


}
