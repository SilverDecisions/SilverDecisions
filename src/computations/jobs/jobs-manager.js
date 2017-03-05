import * as log from "../../log";
import {Utils} from "../../utils";
import {SensitivityAnalysisJob} from "./configurations/sensitivity-analysis/sensitivity-analysis-job";
import {JobLauncher} from "./engine/job-launcher";
import {JobWorker} from "./job-worker";
import {JobExecutionListener} from "./engine/job-execution-listener";
import {JobParameters} from "./engine/job-parameters";
import {IdbJobRepository} from "./engine/job-repository/idb-job-repository";
import {JOB_EXECUTION_FLAG} from "./engine/job-execution-flag";
import {RecomputeJob} from "./configurations/recompute/recompute-job";

export class JobsManager extends JobExecutionListener {


    useWorker;
    expressionsEvaluator;
    objectiveRulesManager;
    jobWorker;

    jobRepository;
    jobLauncher;

    jobExecutionListeners = [];

    afterJobExecutionPromiseResolves = {};

    constructor(expressionsEvaluator, objectiveRulesManager, workerUrl) {
        super();
        this.expressionEngine = expressionsEvaluator.expressionEngine;
        this.expressionsEvaluator = expressionsEvaluator;
        this.objectiveRulesManager = objectiveRulesManager;

        this.jobRepository = new IdbJobRepository(this.expressionEngine.getJsonReviver());
        this.registerJobs();

        this.useWorker = !!workerUrl;
        if (this.useWorker) {
            this.initWorker(workerUrl);
        }

        this.jobLauncher = new JobLauncher(this.jobRepository, this.jobWorker, (data)=>this.serializeData(data));
    }

    serializeData(data) {
        return data.serialize(true, false, false, this.expressionEngine.getJsonReplacer());
    }

    getProgress(jobExecutionOrId) {
        var id = jobExecutionOrId;
        if (!Utils.isString(jobExecutionOrId)) {
            id = jobExecutionOrId.id
        }
        return this.jobRepository.getJobExecutionProgress(id);
    }

    run(jobName, jobParametersValues, data, resolvePromiseAfterJobIsLaunched = true) {
        return this.jobLauncher.run(jobName, jobParametersValues, data, resolvePromiseAfterJobIsLaunched).then(jobExecution=>{
            if(resolvePromiseAfterJobIsLaunched || !jobExecution.isRunning()){
                return jobExecution;
            }
            //job was delegated to worker and is still running

            return new Promise((resolve, reject)=>{
                this.afterJobExecutionPromiseResolves[jobExecution.id] = resolve;
            });
        });
    }

    execute(jobExecutionOrId) {
        return this.jobLauncher.execute(jobExecutionOrId);
    }

    stop(jobExecutionOrId) {
        var id = jobExecutionOrId;
        if (!Utils.isString(jobExecutionOrId)) {
            id = jobExecutionOrId.id
        }

        return this.jobRepository.getJobExecutionById(id).then(jobExecution=> {
            if (!jobExecution) {
                log.error("Job Execution not found: " + jobExecutionOrId);
                return null;
            }
            if (!jobExecution.isRunning()) {
                log.warn("Job Execution not running, status: " + jobExecution.status + ", endTime: " + jobExecution.endTime);
                return jobExecution;
            }

            return this.jobRepository.saveJobExecutionFlag(jobExecution.id, JOB_EXECUTION_FLAG.STOP).then(()=>jobExecution);
        });
    }


    createJobParameters(jobName, jobParametersValues) {
        var job = this.jobRepository.getJobByName(jobName);
        return job.createJobParameters(jobParametersValues);
    }


    /*Returns a promise*/
    getLastJobExecution(jobName, jobParameters) {
        if (this.useWorker) {
            return this.jobWorker;
        }
        if (!(jobParameters instanceof JobParameters)) {
            jobParameters = this.createJobParameters(jobParameters)
        }
        return this.jobRepository.getLastJobExecution(jobName, jobParameters);
    }

    initWorker(workerUrl) {
        this.jobWorker = new JobWorker(workerUrl);
        var argsDeserializer = (args)=> {
            return [this.jobRepository.reviveJobExecution(args[0])]
        };

        this.jobWorker.addListener("beforeJob", this.beforeJob, this, argsDeserializer);
        this.jobWorker.addListener("afterJob", this.afterJob, this, argsDeserializer);
    }

    registerJobs() {
        this.registerJob(new SensitivityAnalysisJob(this.jobRepository, this.expressionsEvaluator, this.objectiveRulesManager));
        this.registerJob(new RecomputeJob(this.jobRepository, this.expressionsEvaluator, this.objectiveRulesManager));
    }

    registerJob(job) {
        this.jobRepository.registerJob(job);
        job.registerExecutionListener(this)
    }

    registerJobExecutionListener(listener) {
        this.jobExecutionListeners.push(listener);
    }

    beforeJob(jobExecution) {
        log.debug("beforeJob", this.useWorker, jobExecution);
        this.jobExecutionListeners.forEach(l=>l.beforeJob(jobExecution));
    }

    afterJob(jobExecution) {
        log.debug("afterJob", this.useWorker, jobExecution);
        this.jobExecutionListeners.forEach(l=>l.afterJob(jobExecution));
        var promiseResolve = this.afterJobExecutionPromiseResolves[jobExecution.id];
        if(promiseResolve){
            promiseResolve(jobExecution)
        }
    }
}
