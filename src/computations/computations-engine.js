import {Utils} from "../utils";
import {DataModel} from "../model";
import {ExpressionEngine} from "../expression-engine/expression-engine";
import {ComputationsManager} from "./computations-manager";
import * as log from "../log";
import {JobParameters} from "./jobs/engine/job-parameters";
import {SensitivityAnalysisJobParameters} from "./jobs/configurations/sensitivity-analysis/sensitivity-analysis-job-parameters";
import {JobExecutionListener} from "./jobs/engine/job-execution-listener";



export class ComputationsEngineConfig{
    logLevel = 'warn';
    constructor(custom) {
        if (custom) {
            Utils.deepExtend(this, custom);
        }
    }
}

//Entry point class for standalone computation workers
export class ComputationsEngine{

    global = Utils.getGlobalObject();
    isWorker = Utils.isWorker();
    dataModel;

    constructor(config){
        this.setConfig(config);
        this.dataModel = new DataModel();
        this.computationsManager = new ComputationsManager(this.dataModel, {});

        if(this.isWorker) {
            this.computationsManager.jobsManger.registerJobExecutionListener({
                beforeJob: (jobExecution)=>{
                    this.reply('beforeJob', Utils.stringify(jobExecution, [this.dataModel.getJsonReplacer(), this.computationsManager.expressionEngine.getJsonReplacer()]));
                },

                afterJob: (jobExecution)=>{
                    this.reply('afterJob', Utils.stringify(jobExecution, [this.dataModel.getJsonReplacer(), this.computationsManager.expressionEngine.getJsonReplacer()]));
                }
            });

            var instance = this;
            this.queryableFunctions = {
                runJob: function(jobName, jobParametersValues, dataDTO){
                    // console.log(jobName, jobParameters, serializedData);
                    var data = new DataModel(dataDTO);
                    instance.computationsManager.runJob(jobName, jobParametersValues, data);
                }
            };

            global.onmessage = function(oEvent) {
                if (oEvent.data instanceof Object && oEvent.data.hasOwnProperty('queryMethod') && oEvent.data.hasOwnProperty('queryArguments')) {
                    instance.queryableFunctions[oEvent.data.queryMethod].apply(self, oEvent.data.queryArguments);
                } else {
                    instance.defaultReply(oEvent.data);
                }
            };
        }
    }



    setConfig(config) {
        if (!config) {
            this.config = new ComputationsEngineConfig();
        } else {
            this.config = new ComputationsEngineConfig(config);
        }
        this.setLogLevel(this.config.logLevel);
        return this;
    }

    setLogLevel(level){
        log.setLevel(level)
    }

    defaultReply(message) {
        this.reply('test', message);
    }


    reply() {
        if (arguments.length < 1) {
            throw new TypeError('reply - not enough arguments');
        }
        this.global.postMessage({
            'queryMethodListener': arguments[0],
            'queryMethodArguments': Array.prototype.slice.call(arguments, 1)
        });
    }
}

