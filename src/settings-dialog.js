import * as d3 from './d3'
import {Dialog} from './dialog'

export class SettingsDialog extends Dialog{

    constructor(app){
        super(app.container.select('#sd-settings-dialog'), app);

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

    onOpen(){
        this.payoffCurrencyInput.node().value = this.app.config.format.payoff.currency;
        this.payoffMinimumFractionDigitsInput.node().value = this.app.config.format.payoff.minimumFractionDigits;
        this.payoffMaximumFractionDigitsInput.node().value = this.app.config.format.payoff.maximumFractionDigits;
    }

}
