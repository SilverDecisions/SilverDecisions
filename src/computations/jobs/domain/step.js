import {JOB_STATUS} from "./job-status";
import * as log from "../../../log"
import {JobInterruptedException} from "./exceptions/job-interrupted-exception";
/*domain object representing the configuration of a job step*/
export class Step {

    id;
    name;
    isRestartable = true;
    steps = [];
    executionListeners = [];

    constructor(name) {
        this.name = name;
    }

    /*Process the step and assign progress and status meta information to the StepExecution provided*/
    execute(stepExecution) {
        log.debug("Executing step: name=" + this.name);
        stepExecution.startTime = new Date();
        stepExecution.status = JOB_STATUS.STARTED;
        // jobRepository.update(stepExecution);

        var exitStatus = JOB_STATUS.EXECUTING;
        // doExecutionRegistration(stepExecution);

        try {
            this.executionListeners.forEach(listener=>listener.beforeStep(stepExecution));
            open(stepExecution.executionContext);


            this.doExecute(stepExecution);

            exitStatus = stepExecution.exitStatus;

            // Check if someone is trying to stop us
            if (stepExecution.terminateOnly) {
                throw new JobInterruptedException("JobExecution interrupted.");
            }

            // Need to upgrade here not set, in case the execution was stopped
            stepExecution.status = JOB_STATUS.COMPLETED;
            log.debug("Step execution success: name=" + this.name);
        }
        catch (e) {
            stepExecution.status = this.determineJobStatus(e);
            exitStatus = stepExecution.status;
            stepExecution.failureExceptions.push(e);

            if (stepExecution.status == JOB_STATUS.STOPPED) {
                log.info("Encountered interruption executing step: " + this.name + " in job: " + stepExecution.jobExecution.jobInstance.jobName, e);
            }
            else {
                log.info("Encountered an error executing step: " + this.name + " in job: " + stepExecution.jobExecution.jobInstance.jobName, e);
            }
        }
        finally {

            try {
                stepExecution.exitStatus = exitStatus;
                this.executionListeners.forEach(listener=>listener.afterStep(stepExecution));
            }
            catch (e) {
                log.error("Exception in afterStep callback in step " + this.name + " in job: " + stepExecution.jobExecution.jobInstance.jobName, e);
            }

            stepExecution.endTime = new Date();
            stepExecution.exitStatus = exitStatus;

            try {
                this.close(stepExecution.executionContext);
            }
            catch (e) {
                log.error("Exception while closing step execution resources in step: " + this.name + " in job: " + stepExecution.jobExecution.jobInstance.jobName, e);
                stepExecution.failureExceptions.push(e);
            }

            // doExecutionRelease();

            log.debug("Step execution complete: " + stepExecution.id);
        }
    }

    determineJobStatus(e) {
        if (e instanceof JobInterruptedException) {
            return JOB_STATUS.STOPPED;
        }
        else {
            return JOB_STATUS.FAILED;
        }
    }

    /**
     * Extension point for subclasses to execute business logic. Subclasses should set the exitStatus on the
     * StepExecution before returning.
     */
    doExecute(stepExecution) {
    }

    /**
     * Extension point for subclasses to provide callbacks to their collaborators at the beginning of a step, to open or
     * acquire resources. Does nothing by default.
     */
    open(executionContext) {
    }

    /**
     * Extension point for subclasses to provide callbacks to their collaborators at the end of a step (right at the end
     * of the finally block), to close or release resources. Does nothing by default.
     */
    close(executionContext) {
    }
}
