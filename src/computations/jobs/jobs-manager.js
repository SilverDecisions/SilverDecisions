import {DisplayMode} from "../display-mode";

export class JobsManager extends DisplayMode {
    static $MODE_NAME = 'job';


    constructor(data, expressionEngine) {
        super(JobsManager.$MODE_NAME);
        this.data = data;
        this.expressionEngine = expressionEngine;
    }


    run(job, jobParameters) {

    }
}
