import {ExpressionEngine} from "../expression-engine/expression-engine";
import * as log from "../log";
import {Utils} from "../utils";
import {ObjectiveRulesManager} from "./objective/objective-rules-manager";
import {TreeValidator} from "./validation/tree-validator";
import {OperationsManager} from "./operations/operations-manager";
import {JobsManager} from "./jobs/jobs-manager";
import {ExpressionsEvaluator} from "./expressions-evaluator";
import {JobDataInvalidException} from "./jobs/engine/exceptions/job-data-invalid-exception";
import {JobParametersInvalidException} from "./jobs/engine/exceptions/job-parameters-invalid-exception";


export class ComputationsManagerConfig {

    ruleName = null;
    worker = {
        delegateRecomputation:false,
        url: null
    };


    constructor(custom) {
        if (custom) {
            Utils.deepExtend(this, custom);
        }
    }
}

export class ComputationsManager {
    data;
    expressionEngine;

    expressionsEvaluator;
    objectiveRulesManager;
    operationsManager;
    jobsManger;

    treeValidator;

    constructor(data, config) {
        this.data = data;
        this.setConfig(config);
        this.expressionEngine = new ExpressionEngine();
        this.expressionsEvaluator = new ExpressionsEvaluator(this.expressionEngine);
        this.objectiveRulesManager = new ObjectiveRulesManager(this.data, this.expressionEngine, this.config.ruleName);
        this.operationsManager = new OperationsManager(this.data, this.expressionEngine);
        this.jobsManger = new JobsManager(this.expressionsEvaluator, this.objectiveRulesManager, this.config.worker.url);
        this.treeValidator = new TreeValidator(this.expressionEngine);
    }

    setConfig(config) {
        this.config = new ComputationsManagerConfig(config);
        return this;
    }

    getCurrentRule() {
        return this.objectiveRulesManager.currentRule;
    }

    testJob(testStop = false, stopAt = 10, resume = true) {
        var stopped = false;
        var checkProgress = (r)=> {
            var starttime = new Date().getTime();
            this.jobsManger.getProgress(r).then(progress=> {
                progress = progress || 0;
                log.debug('progress', progress, (new Date().getTime() - starttime) / 1000);
                if (progress < 100) {

                    if (testStop && !stopped && progress >= stopAt) {
                        log.debug('stopping', r);
                        this.jobsManger.stop(r).then(()=> {
                            stopped = true;
                            log.debug('stpping result', r)
                            if (resume) {
                                var _this = this;
                                setTimeout(function () {
                                    log.debug('resume', r.jobParameters.values)
                                    _this.runJob("sensitivity-analysis", r.jobParameters.values).then(_r=> {
                                        log.debug(_r);
                                        checkProgress(_r);

                                    }).catch(e=> {
                                        if (e instanceof JobDataInvalidException) {
                                            log.warn("Jod data is invalid: " + e);
                                        } else if (e instanceof JobParametersInvalidException) {
                                            log.warn("Jod parameters are invalid: " + e);
                                        } else {
                                            log.error(e);
                                        }

                                    })
                                }, 2000);
                            }
                        })
                        return;
                    }

                    setTimeout(function () {
                        checkProgress(r)
                    }, 100);
                }

            })

        };
        var jobParamsValues = {
            ruleName: this.getCurrentRule().name,
            variables: [
                {name: 'p', min: 0, max: 1, length: 11},
                {name: 'a', min: 1, max: 10, length: 10},
                {name: 'b', min: 0, max: 100, length: 10}
            ]
        };
        this.runJob("sensitivity-analysis", jobParamsValues).then(r=> {
            log.debug(r);


            checkProgress(r);

        }).catch(e=> {
            if (e instanceof JobDataInvalidException) {
                log.warn("Jod data is invalid: " + e);
            } else if (e instanceof JobParametersInvalidException) {
                log.warn("Jod parameters are invalid: " + e);
            } else {
                log.error(e);
            }

        })
    }

    runJob(name, jobParamsValues, data, resolvePromiseAfterJobIsLaunched = true) {
        return this.jobsManger.run(name, jobParamsValues, data || this.data, resolvePromiseAfterJobIsLaunched);
    }

    getObjectiveRules() {
        return this.objectiveRulesManager.rules;
    }

    isRuleName(ruleName) {
        return this.objectiveRulesManager.isRuleName(ruleName)
    }

    setCurrentRuleByName(ruleName) {
        this.config.ruleName = ruleName;
        return this.objectiveRulesManager.setCurrentRuleByName(ruleName)
    }

    operationsForObject(object) {
        return this.operationsManager.operationsForObject(object);
    }

    checkValidityAndRecomputeObjective(allRules, evalCode = false, evalNumeric = true) {
        return Promise.resolve().then(()=> {
            if (this.config.worker.delegateRecomputation) {
                var params = {
                    evalCode: evalCode,
                    evalNumeric: evalNumeric
                };
                if(!allRules){
                    params.ruleName = this.getCurrentRule().name;
                }
                return this.runJob("recompute", params, this.data, false).then((jobExecution)=>{
                    var d = jobExecution.getData();
                    this.data.updateFrom(d)
                })
            }
            return this._checkValidityAndRecomputeObjective(this.data, allRules, evalCode, evalNumeric);
        }).then(()=> {
            this.updateDisplayValues(this.data);
        })

    }

    _checkValidityAndRecomputeObjective(data, allRules, evalCode = false, evalNumeric = true) {
        data.validationResults = [];

        if (evalCode || evalNumeric) {
            this.expressionsEvaluator.evalExpressions(data, evalCode, evalNumeric);
        }

        data.getRoots().forEach(root=> {
            var vr = this.treeValidator.validate(data.getAllNodesInSubtree(root));
            data.validationResults.push(vr);
            if (vr.isValid()) {
                this.objectiveRulesManager.recomputeTree(root, allRules);
            }
        });
    }

    updateDisplayValues(data) {
        data.nodes.forEach(n=> {
            this.updateNodeDisplayValues(n);
        });
        data.edges.forEach(e=> {
            this.updateEdgeDisplayValues(e);
        })
    }

    updateNodeDisplayValues(node) {
        node.$DISPLAY_VALUE_NAMES.forEach(n=>node.displayValue(n, this.objectiveRulesManager.getNodeDisplayValue(node, n)));
    }

    updateEdgeDisplayValues(e) {
        e.$DISPLAY_VALUE_NAMES.forEach(n=>e.displayValue(n, this.objectiveRulesManager.getEdgeDisplayValue(e, n)));
    }
}
