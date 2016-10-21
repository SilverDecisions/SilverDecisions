import * as d3 from './d3'
import {i18n} from './i18n/i18n'

import {Utils} from './utils'

export class Dialog{

    app;

    container;

    constructor(container,app){
        this.app = app;
        this.container=container;
        this.container.select('.sd-close-modal').on('click', ()=>this.close());
    }

    open(){
        this.onOpen();
        this.container.classed('open', true);
    }
    close(){
        this.container.classed('open', false);
    }

    onOpen(){

    }
}
