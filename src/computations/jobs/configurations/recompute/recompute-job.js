import {SimpleJob} from "../../engine/simple-job";
import {Step} from "../../engine/step";
import {JOB_STATUS} from "../../engine/job-status";
import {TreeValidator} from "../../../validation/tree-validator";
import * as _ from "lodash";
import {BatchStep} from "../../engine/batch/batch-step";
import {RecomputeJobParameters} from "./recompute-job-parameters";
import {Job} from "../../engine/job";

export class RecomputeJob extends Job {

    constructor(jobRepository, expressionsEvaluator, objectiveRulesManager) {
        super("recompute", jobRepository);
        this.isRestartable = false;
        this.expressionsEvaluator = expressionsEvaluator;
        this.objectiveRulesManager = objectiveRulesManager;
        this.treeValidator = new TreeValidator();
    }

    doExecute(execution) {
        var data = execution.getData();
        var params = execution.jobParameters;
        var ruleName = params.value("ruleName");
        var allRules = !ruleName;
        if(ruleName){
            this.objectiveRulesManager.setCurrentRuleByName(ruleName);
        }
        this.checkValidityAndRecomputeObjective(data, allRules, params.value("evalCode"), params.value("evalNumeric"))
        return execution;
    }

    checkValidityAndRecomputeObjective(data, allRules, evalCode, evalNumeric) {
        data.validationResults = [];

        if(evalCode||evalNumeric){
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

    createJobParameters(values) {
        return new RecomputeJobParameters(values);
    }
}
