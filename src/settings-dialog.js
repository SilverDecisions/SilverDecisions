import * as d3 from './d3'
import {i18n} from './i18n/i18n'

import {Utils} from './utils'

export class SettingsDialog{

    app;

    container;

    constructor(app){
        this.app = app;
        this.container = app.container.select('#sd-settings-dialog');
        this.container.select('.sd-close-modal').on('click', ()=>this.close());


        this.payoffCurrencyInput = this.container.select('input#sd-payoff-currency').on('change', function(){
            app.config.format.payoff.currency = this.value;
            app.updatePayoffNumberFormat();
        });

        this.payoffMinimumFractionDigitsInput = this.container.select('input#sd-payoff-minimumFractionDigits').on('change', function(){
            app.config.format.payoff.minimumFractionDigits = this.value;
            app.updatePayoffNumberFormat();
        });

        this.payoffMaximumFractionDigitsInput = this.container.select('input#sd-payoff-maximumFractionDigits').on('change', function(){
            app.config.format.payoff.maximumFractionDigits = this.value;
            app.updatePayoffNumberFormat();
        });
    }

    open(){
        this.payoffCurrencyInput.node().value = this.app.config.format.payoff.currency;
        this.payoffMinimumFractionDigitsInput.node().value = this.app.config.format.payoff.minimumFractionDigits;
        this.payoffMaximumFractionDigitsInput.node().value = this.app.config.format.payoff.maximumFractionDigits;
        this.container.classed('open', true);
    }
    close(){
        this.container.classed('open', false);
    }
}
