import {Utils} from "sd-utils";
import {JobParameters} from "../../engine/job-parameters";
import {JobParameterDefinition, PARAMETER_TYPE} from "../../engine/job-parameter-definition";
export class SensitivityAnalysisJobParameters extends JobParameters {

    initDefinitions() {
        this.definitions.push(new JobParameterDefinition("id", PARAMETER_TYPE.STRING, 1, 1, true));
        this.definitions.push(new JobParameterDefinition("ruleName", PARAMETER_TYPE.STRING));
        this.definitions.push(new JobParameterDefinition("variables", [
                new JobParameterDefinition("name", PARAMETER_TYPE.STRING),
                new JobParameterDefinition("min", PARAMETER_TYPE.NUMBER),
                new JobParameterDefinition("max", PARAMETER_TYPE.NUMBER),
                new JobParameterDefinition("length", PARAMETER_TYPE.INTEGER).set("singleValueValidator", v => v >= 0),
            ], 1, Infinity, false,
            v => v["min"] <= v["max"],
            values => Utils.isUnique(values, v=>v["name"]) //Variable names should be unique
        ))
    }

    initDefaultValues() {
        this.values = {
            id: Utils.guid()
        }
    }
}
