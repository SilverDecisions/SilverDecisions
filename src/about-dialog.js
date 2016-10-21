import * as d3 from './d3'
import {Dialog} from './dialog'

export class AboutDialog extends Dialog{

    constructor(app){
        super(app.container.select('#sd-about-dialog'), app);
    }

}
