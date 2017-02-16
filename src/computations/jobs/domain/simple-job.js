import * as log from "../../../log"
import {JOB_STATUS} from "./job-status";
import {Job} from "./job";
import *  as _ from 'lodash'
import {ExecutionContext} from "./execution-context";

/* Simple Job that sequentially executes a job by iterating through its list of steps.  Any Step that fails will fail the job.  The job is
 considered complete when all steps have been executed.*/

export class SimpleJob extends Job {

    steps = [];

    constructor(name) {
        super(name)
    }

    getStep(stepName) {
        return _.find(this.steps, s=>s.name == stepName);
    }

    doExecute(execution) {
        var stepExecution = null;

        var allCompleted = this.steps.every(step=> {
            stepExecution = this.handleStep(step, execution);
            return stepExecution.status == JOB_STATUS.COMPLETED; // Terminate the job if a step fails
        });

        //
        // Update the job status to be the same as the last step
        //
        if (stepExecution != null) {
            log.debug("Updating JobExecution status: " + stepExecution);
            execution.status = stepExecution.status;
            execution.exitStatus = stepExecution.exitStatus;
        }
    }

    handleStep(step, execution) {
        if (execution.isStopping()) {
            throw new Error("JobExecution interrupted.");
        }

        var jobInstance = execution.jobInstance;
        var lastStepExecution = this.jobRepository.getLastStepExecution(jobInstance, step.name);
        if (this.stepExecutionPartOfExistingJobExecution(execution, lastStepExecution)) {
            // If the last execution of this step was in the same job, it's probably intentional so we want to run it again.
            log.info("Duplicate step detected in execution of job. step" + step.getName() + " jobName: ", jobInstance.jobName);
            lastStepExecution = null;
        }
        var currentStepExecution = lastStepExecution;

        if (this.shouldStart(lastStepExecution, execution, step)) {

            currentStepExecution = execution.createStepExecution(step.getName());

            var isRestart = lastStepExecution != null && !lastStepExecution.status == JOB_STATUS.COMPLETED;

            if (isRestart) {
                currentStepExecution.executionContext = lastStepExecution.executionContext;
                if (lastStepExecution.executionContext.containsKey("executed")) {
                    currentStepExecution.executionContext.remove("executed");
                }
            }
            else {
                currentStepExecution.executionContext = new ExecutionContext(this.executionContext.data);
            }

            this.jobRepository.addStepExecution(currentStepExecution);

            log.info("Executing step: [" + step.name + "]");
            try {
                step.execute(currentStepExecution);
                currentStepExecution.executionContext.put("executed", true);
            }
            catch (e) {
                execution.status = JOB_STATUS.FAILED;
                throw e;
            }

            if (currentStepExecution.status == JOB_STATUS.STOPPING
                || currentStepExecution.status == JOB_STATUS.STOPPED) {
                // Ensure that the job gets the message that it is stopping
                execution.status = JOB_STATUS.STOPPING;
                // throw new Error("Job interrupted by step execution");
            }

        }

        return currentStepExecution;
    }

    stepExecutionPartOfExistingJobExecution(jobExecution, stepExecution) {
        return stepExecution != null && stepExecution.jobExecution.id == jobExecution.id
    }

    shouldStart(lastStepExecution, execution, step) {
        var stepStatus;
        if (lastStepExecution == null) {
            stepStatus = JOB_STATUS.STARTING;
        }
        else {
            stepStatus = lastStepExecution.status;
        }

        if (stepStatus == JOB_STATUS.UNKNOWN) {
            throw new Error("Cannot restart step from UNKNOWN status")
        }

        return stepStatus != JOB_STATUS.COMPLETED || step.isRestartable;
    }
}
