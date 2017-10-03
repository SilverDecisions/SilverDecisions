import * as d3 from '../d3'
import {Dialog} from './dialog'
import {Utils} from "sd-utils";
import {AppUtils} from "../app-utils";
import {Templates} from "../templates";
import {domain as model} from "sd-model";
import {i18n} from "../i18n/i18n";

export class DefinitionsDialog extends Dialog {
    changeCallback;

    constructor(app) {
        super(app.container.select('#sd-definitions-dialog'), app);
        var self = this;

        this.definitionsScopeLabel = this.container.select(".sd-definitions-dialog-scope-label");

        this.definitionsCode = this.container.select('textarea#sd-definitions-dialog-definitions-code').on('input', function () {
            AppUtils.updateInputClass(d3.select(this));
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
        AppUtils.elasticTextarea(this.definitionsCode);

        document.addEventListener('SilverDecisionsRecomputedEvent', function (data) {
            if (data.detail === app && self.isVisible()) {
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

        let scopeType = 'global';
        let labelSuffix="";
        if (this.definitionsSourceObject instanceof model.Node) {
            scopeType = 'node';
            let name =  this.definitionsSourceObject.name;
            if(name){
                labelSuffix += " ("+name+")"
            }
        }
        this.definitionsScopeLabel.text(i18n.t("definitionsDialog.scope."+scopeType)+labelSuffix);

        this.definitionsCode.node().value = this.definitionsSourceObject.code;
        AppUtils.updateInputClass(this.definitionsCode);
        AppUtils.autoResizeTextarea(this.definitionsCode.node());
        this.definitionsCode.classed('invalid', !!this.definitionsSourceObject.$codeError);
        if(this.definitionsSourceObject.$codeError){
            this.printError(this.definitionsSourceObject.$codeError);
        }else{
            this.printVariables(this.definitionsSourceObject.expressionScope);
        }

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
