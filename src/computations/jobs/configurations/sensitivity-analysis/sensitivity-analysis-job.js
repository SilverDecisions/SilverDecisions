import {SimpleJob} from "../../engine/simple-job";
import {Step} from "../../engine/step";
import {JOB_STATUS} from "../../engine/job-status";
import {TreeValidator} from "../../../validation/tree-validator";
import {SensitivityAnalysisJobParameters} from "./sensitivity-analysis-job-parameters";
import * as _ from "lodash";

export class SensitivityAnalysisJob extends SimpleJob{

    constructor(jobRepository, expressionsEvaluator, objectiveRulesManager){
        super("sensitivity-analysis", jobRepository);
        this.treeValidator = new TreeValidator();

        this.addStep("prepare_variables", (stepExecution) => {
            var params = stepExecution.getJobParameters();
            var variables = params.value("variables");

            var variableValues = [];
            variables.forEach(v=> {
                variableValues.push(this.sequence(v.min, v.max, v.length));
            });
            variableValues = this.cartesianProductOf(variableValues);
            stepExecution.executionContext.put("variableValues", variableValues);
            stepExecution.getJobExecutionContext().put("variableValues", variableValues);

            stepExecution.exitStatus = JOB_STATUS.COMPLETED;
        });


        this.addStep("calculate_step", (stepExecution) => {
            var params = stepExecution.getJobParameters();
            var variableNames = params.value("variables").map(v=>v.name);

            var data = stepExecution.executionContext.get("data");
            var variableValues = stepExecution.executionContext.get("variableValues");
            var ruleName = params.value("ruleName");
            objectiveRulesManager.setCurrentRuleByName(ruleName);
            var treeRoot = data.getRoots()[0];

            var computedVariableCombinations = 0;
            stepExecution.executionContext.put("computedVariableCombinations", computedVariableCombinations);
            variableValues.forEach(values=>{
                expressionsEvaluator.evalGlobalCode(data);
                variableNames.forEach((variableName, i)=>{
                    data.expressionScope[variableName]=values[i];
                });
                expressionsEvaluator.evalExpressionsForNode(data, treeRoot);
                var vr = this.treeValidator.validate(data.getAllNodesInSubtree(treeRoot));
                if (vr.isValid()) {
                    objectiveRulesManager.recomputeTree(treeRoot, false);
                }
                stepExecution.executionContext.put("computedVariableCombinations", ++computedVariableCombinations);
            });

            stepExecution.exitStatus = JOB_STATUS.COMPLETED;
        });
    }



    createJobParameters(values){
        return new SensitivityAnalysisJobParameters(values);
    }

    getJobDataValidator() {
        return {
            validate: (data) => data.getRoots().length === 1
        }
    }

    getProgress(execution){
        if(!execution.stepExecutions.length){
            return 0;
        }
        if(execution.stepExecutions.length==1){
            return JOB_STATUS.COMPLETED === execution.stepExecutions[0].status ? 1 : 0;
        }
        var lastStepExecution = execution.stepExecutions[1];
        if(JOB_STATUS.COMPLETED === lastStepExecution.status){
            return 100;
        }
        var computedVariableCombinations = lastStepExecution.executionContext.get("computedVariableCombinations") || 0;

        return Math.max(1, + Math.round(computedVariableCombinations*99/lastStepExecution.executionContext.get("variableValues").length));
    }

    sequence(min, max, length){
        var extent = max-min;
        var step = extent/(length-1);
        var result = [min];
        var curr = min;

        for(var i =0; i<length-2; i++){
            curr+=step;
            result.push(curr);
        }
        result.push(max);
        return result;
    }

    cartesianProductOf(arrays) {
        return _.reduce(arrays, function(a, b) {
            return _.flatten(_.map(a, function(x) {
                return _.map(b, function(y) {
                    return x.concat([y]);
                });
            }), true);
        }, [ [] ]);
    };

}
