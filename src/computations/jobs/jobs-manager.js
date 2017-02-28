import {JobRepository} from "./engine/job-repository/job-repository";
import {JobRestartException} from "./engine/exceptions/job-restart-exception";
import {JOB_STATUS} from "./engine/job-status";
import * as log from "../../log";
import {Utils} from "../../utils";
import {SensitivityAnalysisJob} from "./configurations/sensitivity-analysis/sensitivity-analysis-job";
import {JobLauncher} from "./engine/job-launcher";
import {JobWorker} from "./job-worker";
import {JobExecutionListener} from "./engine/job-execution-listener";
import {JobParameters} from "./engine/job-parameters";
import {SimpleJobRepository} from "./engine/job-repository/simple-job-repository";

export class JobsManager extends JobExecutionListener{


    useWorker;
    expressionsEvaluator;
    objectiveRulesManager;
    jobWorker;

    jobRepository;
    jobLauncher;

    jobExecutionListeners=[];

    constructor(expressionsEvaluator, objectiveRulesManager, workerUrl) {
        super();
        this.expressionEngine = expressionsEvaluator.expressionEngine;
        this.expressionsEvaluator = expressionsEvaluator;
        this.objectiveRulesManager = objectiveRulesManager;

        this.jobRepository = new SimpleJobRepository();
        this.registerJobs();

        this.useWorker = !!workerUrl;
        if(this.useWorker){
            this.initWorker(workerUrl);
        }

        this.jobLauncher = new JobLauncher(this.jobRepository, this.jobWorker, (data)=>this.serializeData(data));


    }

    serializeData(data){
        return data.serialize(true, false, false, this.expressionEngine.getJsonReplacer());
    }


    run(jobName, jobParametersValues, data) {
        return this.jobLauncher.run(jobName, jobParametersValues, data);
    }

    createJobParameters(jobName, jobParametersValues){
        var job = this.jobRepository.getJobByName(jobName);
        return job.createJobParameters(jobParametersValues);
    }



    /*Returns a promise*/
    getLastJobExecution(jobName, jobParameters) {
        if(this.useWorker){
            return this.jobWorker;
        }
        if(!(jobParameters instanceof JobParameters)){
            jobParameters = this.createJobParameters(jobParameters)
        }
        return this.jobRepository.getLastJobExecution(jobName, jobParameters);
    }

    initWorker(workerUrl) {
        this.jobWorker = new JobWorker(workerUrl);
        var argsDeserializer = (args)=>{
            return [JSON.parse(args[0], this.expressionEngine.getJsonReviver())]
        };

        this.jobWorker.addListener("beforeJob", this.beforeJob, this, argsDeserializer);
        this.jobWorker.addListener("afterJob", this.afterJob, this, argsDeserializer);
    }

    registerJobs() {
        this.registerJob(new SensitivityAnalysisJob(this.jobRepository, this.expressionsEvaluator, this.objectiveRulesManager));
    }

    registerJob(job){
        this.jobRepository.registerJob(job);
        job.registerExecutionListener(this)
    }

    registerJobExecutionListener(listener){
        this.jobExecutionListeners.push(listener);
    }

    beforeJob(jobExecution){
        log.debug("beforeJob",this.useWorker, jobExecution);
        this.jobExecutionListeners.forEach(l=>l.beforeJob(jobExecution));
    }

    afterJob(jobExecution){
        log.debug("afterJob", this.useWorker, jobExecution);
        this.jobExecutionListeners.forEach(l=>l.afterJob(jobExecution));
    }
}
