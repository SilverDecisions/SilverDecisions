import {SimpleJob} from "../../engine/simple-job";
import {Step} from "../../engine/step";
import {JOB_STATUS} from "../../engine/job-status";
import {TreeValidator} from "../../../validation/tree-validator";
import {SensitivityAnalysisJobParameters} from "./sensitivity-analysis-job-parameters";
import * as _ from "lodash";
import {BatchStep} from "../../engine/batch/batch-step";

export class SensitivityAnalysisJob extends SimpleJob {

    constructor(jobRepository, expressionsEvaluator, objectiveRulesManager) {
        super("sensitivity-analysis", jobRepository);
        this.addStep(new PrepareVariablesStep(jobRepository));
        this.addStep(new CalculateStep(jobRepository, expressionsEvaluator, objectiveRulesManager));
    }

    createJobParameters(values) {
        return new SensitivityAnalysisJobParameters(values);
    }

    getJobDataValidator() {
        return {
            validate: (data) => data.getRoots().length === 1
        }
    }

    getProgress(execution) {
        if (JOB_STATUS.COMPLETED === execution.status) {
            return 100;
        }
        if (!execution.stepExecutions.length) {
            return 0;
        }
        if (execution.stepExecutions.length == 1) {
            return JOB_STATUS.COMPLETED === execution.stepExecutions[0].status ? 1 : 0;
        }
        var lastStepExecution = execution.stepExecutions[1];
        if (JOB_STATUS.COMPLETED === lastStepExecution.status) {
            return 100;
        }


        return Math.max(1, Math.round(this.steps[1].getProgress(lastStepExecution) * 0.98));
    }

}

class PrepareVariablesStep extends Step {
    constructor(jobRepository) {
        super("prepare_variables", jobRepository);
    }

    doExecute(stepExecution) {
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
        return stepExecution;
    }

    sequence(min, max, length) {
        var extent = max - min;
        var step = extent / (length - 1);
        var result = [min];
        var curr = min;

        for (var i = 0; i < length - 2; i++) {
            curr += step;
            result.push(curr);
        }
        result.push(max);
        return result;
    }

    cartesianProductOf(arrays) {
        return _.reduce(arrays, function (a, b) {
            return _.flatten(_.map(a, function (x) {
                return _.map(b, function (y) {
                    return x.concat([y]);
                });
            }), true);
        }, [[]]);
    };
}

class InitPoliciesStep extends Step {
    constructor(jobRepository) {
        super("init_policies", jobRepository);
    }

    doExecute(stepExecution) {
        var data = stepExecution.getData();

        //TODO

        stepExecution.exitStatus = JOB_STATUS.COMPLETED;
        return stepExecution;
    }
}

class CalculateStep extends BatchStep {

    constructor(jobRepository, expressionsEvaluator, objectiveRulesManager) {
        super("calculate_step", jobRepository, 5);

        this.expressionsEvaluator = expressionsEvaluator;
        this.objectiveRulesManager = objectiveRulesManager;
        this.treeValidator = new TreeValidator();
    }

    init(stepExecution) {
        var params = stepExecution.getJobParameters();
        var ruleName = params.value("ruleName");
        this.objectiveRulesManager.setCurrentRuleByName(ruleName);

        var variableValues = stepExecution.executionContext.get("variableValues");
        return variableValues.length;
    }


    readNextChunk(stepExecution, startIndex, chunkSize) {
        var variableValues = stepExecution.executionContext.get("variableValues");
        return variableValues.slice(startIndex, startIndex + chunkSize);
    }

    processItem(stepExecution, item) {
        var params = stepExecution.getJobParameters();
        var data = stepExecution.getData();
        var treeRoot = data.getRoots()[0];
        var variableNames = params.value("variables").map(v=>v.name);
        this.expressionsEvaluator.evalGlobalCode(data);
        variableNames.forEach((variableName, i)=> {
            data.expressionScope[variableName] = item[i];
        });
        this.expressionsEvaluator.evalExpressionsForNode(data, treeRoot);
        var vr = this.treeValidator.validate(data.getAllNodesInSubtree(treeRoot));
        if (vr.isValid()) {
            this.objectiveRulesManager.recomputeTree(treeRoot, false);
            return true
        }
        return false;
    }

    writeChunk(stepExecution, items) {

    }

}
