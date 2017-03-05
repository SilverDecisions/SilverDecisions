import {Utils} from "sd-utils";
import {JobParameters} from "../../engine/job-parameters";
import {JobParameterDefinition, PARAMETER_TYPE} from "../../engine/job-parameter-definition";
export class RecomputeJobParameters extends JobParameters {

    initDefinitions() {
        this.definitions.push(new JobParameterDefinition("id", PARAMETER_TYPE.STRING, 1, 1, true));
        this.definitions.push(new JobParameterDefinition("ruleName", PARAMETER_TYPE.STRING, 0));
        this.definitions.push(new JobParameterDefinition("evalCode", PARAMETER_TYPE.BOOLEAN));
        this.definitions.push(new JobParameterDefinition("evalNumeric", PARAMETER_TYPE.BOOLEAN));
    }

    initDefaultValues() {
        this.values = {
            id: Utils.guid(),
            ruleName: null, //recompute all rules
            evalCode: true,
            evalNumeric: true
        }
    }
}
