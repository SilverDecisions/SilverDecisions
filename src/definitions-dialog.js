import * as d3 from './d3'
import {Dialog} from './dialog'
import {Utils} from "./utils";
import * as _ from "lodash";
import {Templates} from "./templates";

export class DefinitionsDialog extends Dialog {
    changeCallback;

    constructor(app) {
        super(app.container.select('#sd-definitions-dialog'), app);
        var self = this;
        this.definitionsCode = this.container.select('textarea#sd-definitions-dialog-definitions-code').on('input', function () {
            Utils.updateInputClass(d3.select(this));
        });

        this.definitionsCode = this.container.select('textarea#sd-definitions-dialog-definitions-code').on('change', function () {
            if (self.changeCallback) {
                self.changeCallback(this.value)
            }
        });

        this.recalculateButton = this.container.select('button#sd-definitions-dialog-recalculate-button').on('click', function () {
            self.app.recompute();
        });

        this.variableValuesContainer = this.container.select("#sd-definitions-dialog-variable-values");
        Utils.elasticTextarea(this.definitionsCode);

        document.addEventListener('SilverDecisionsRecomputedEvent', function (data) {
            if (data.detail === app) {
                self.update();
            }
        });
    }


    open(definitionsSourceObject, changeCallback) {
        super.open();
        this.changeCallback = changeCallback;
        this.definitionsSourceObject = definitionsSourceObject;
        this.update();
    }

    update(force = false) {
        if (!force && !this.isVisible()) {
            return;
        }
        this.definitionsCode.node().value = this.definitionsSourceObject.code;
        Utils.updateInputClass(this.definitionsCode);
        Utils.autoResizeTextarea(this.definitionsCode.node());
        this.definitionsCode.classed('invalid', !!this.definitionsSourceObject.$codeError);
        if(this.definitionsSourceObject.$codeError){
            this.printError(this.definitionsSourceObject.$codeError);
        }else{
            this.printVariables(this.definitionsSourceObject.expressionScope);
        }

    }

    onClosed() {

    }

    printError(error) {
        var html = error;
        this.variableValuesContainer.html(html);
    }

    printVariables(scope) {
        var html = Templates.get('evaluatedVariables', {scopeVariables: Utils.getVariablesAsList(scope)});
        this.variableValuesContainer.html(html);
    }


}
