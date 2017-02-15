/*domain object representing the configuration of a job step*/
export class Step{

    id;
    name;
    isRestartable=true;
    steps = [];

    constructor(name){
        this.name = name;
    }

    execute(jobExecution){

    }

    getJobParametersValidator(){

    }

    /*Called before a job executes*/
    beforeJob(){

    }

    /*Called after completion of a job. Called after both successful and failed executions*/
    afterJob(){

    }
}
