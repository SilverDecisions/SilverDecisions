import {ExpressionEngine} from "../expression-engine/expression-engine";
import * as _ from "lodash";
import * as log from "../log"
import {Utils} from "../utils";
import {ObjectiveRulesManager} from "./objective/objective-rules-manager";
import {TreeValidator} from "./validation/tree-validator";
import {OperationsManager} from "./operations/operations-manager";
import {JobsManager} from "./jobs/jobs-manager";
import {SensitivityAnalysisJobParameters} from "./jobs/configurations/sensitivity-analysis/sensitivity-analysis-job-parameters";
import {JobWorker} from "./jobs/job-worker";
import {ExpressionsEvaluator} from "./expressions-evaluator";


export class ComputationsManagerConfig {

    ruleName = null;
    worker={
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

    constructor(data, config){
        this.data = data;
        this.setConfig(config);
        this.expressionEngine = new ExpressionEngine();
        this.expressionsEvaluator =  new ExpressionsEvaluator(this.expressionEngine);
        this.objectiveRulesManager = new ObjectiveRulesManager(this.data, this.expressionEngine, this.config.ruleName);
        this.operationsManager = new OperationsManager(this.data, this.expressionEngine);
        this.jobsManger = new JobsManager(this.expressionsEvaluator, this.objectiveRulesManager, this.config.worker.url);
        this.treeValidator = new TreeValidator(this.expressionEngine);
    }

    setConfig(config) {
        this.config = new ComputationsManagerConfig(config);
        return this;
    }

    getCurrentRule(){
        return this.objectiveRulesManager.currentRule;
    }

    testJob(){
        this.runJob("sensitivity-analysis", {
            ruleName: this.getCurrentRule().name,
            variables: [
                { name: 'p', min: 0, max: 1, length: 11 },
                { name: 'a', min: 1, max: 10, length: 10 },
                { name: 'b', min: 0, max: 100, length: 10 }
            ]
        });
    }

    runJob(name, jobParamsValues, data){
        this.jobsManger.run(name, jobParamsValues, data || this.data);
    }

    getObjectiveRules(){
        return this.objectiveRulesManager.rules;
    }

    isRuleName(ruleName){
        return this.objectiveRulesManager.isRuleName(ruleName)
    }

    setCurrentRuleByName(ruleName){
        this.config.ruleName=ruleName;
        return this.objectiveRulesManager.setCurrentRuleByName(ruleName)
    }

    operationsForObject(object){
        return this.operationsManager.operationsForObject(object);
    }

    checkValidityAndRecomputeObjective(allRules, evalCode=false, evalNumeric=true) {
        this.data.validationResults = [];

        if(evalCode||evalNumeric){
            this.expressionsEvaluator.evalExpressions(this.data, evalCode, evalNumeric);
        }

        this.data.getRoots().forEach(root=> {
            var vr = this.treeValidator.validate(this.data.getAllNodesInSubtree(root));
            this.data.validationResults.push(vr);
            if (vr.isValid()) {
                this.objectiveRulesManager.recomputeTree(root, allRules);
            }
        });
        this.updateDisplayValues();
    }

    updateDisplayValues() {
        this.data.nodes.forEach(n=>{
            this.updateNodeDisplayValues(n);
        });
        this.data.edges.forEach(e=>{
            this.updateEdgeDisplayValues(e);
        })
    }

    updateNodeDisplayValues(node){
        node.$DISPLAY_VALUE_NAMES.forEach(n=>node.displayValue(n,this.objectiveRulesManager.getNodeDisplayValue(node, n)));
    }

    updateEdgeDisplayValues(e){
        e.$DISPLAY_VALUE_NAMES.forEach(n=>e.displayValue(n,this.objectiveRulesManager.getEdgeDisplayValue(e, n)));
    }
}
