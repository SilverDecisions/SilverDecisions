import {log, Utils} from "sd-utils";
import * as model from "sd-model";

export class TextsInterpolator {
    app;

    interpolatedDiagramTitle;
    interpolatedDiagramDescription;

    constructor(app) {
        this.app = app;
        this.dataModel = this.app.dataModel;
    }

    clearInterpolatedDisplayValues() {

        this.dataModel.nodes.forEach(node => {
            node.displayValue("name", node.name);
        });

        this.dataModel.edges.forEach(edge => {
            edge.displayValue("name", edge.name);
        });

        this.dataModel.texts.forEach(text => {
            text.$displayValue = text.value;
        });

        this.interpolatedDiagramTitle = null;
        this.interpolatedDiagramDescription = null;
    }

    getImports(textInterpolationScope) {
        const self = this;
        let findOptimalEdges = function (node) {
            return node.childEdges.filter(e => e.displayValue('optimal'));
        };
        let payoffFormat = function (value, index) {
            return self.app.payoffNumberFormat[index || 0].format(value);
        }
        let probabilityFormat = function (value) {
            return self.app.probabilityNumberFormat.format(value);
        }
        let getPayoff = (nodeOrEdge) => {
            if (nodeOrEdge instanceof model.domain.Edge) {
                return nodeOrEdge.displayValue("payoff");
            }
            if (nodeOrEdge instanceof model.domain.TerminalNode) {
                return nodeOrEdge.displayValue("aggregatedPayoff");
            }

            return nodeOrEdge.displayValue("childrenPayoff");
        };
        let getProbability = (nodeOrEdge) => {
            if (nodeOrEdge instanceof model.domain.TerminalNode) {
                return nodeOrEdge.displayValue("probabilityToEnter");
            }
            if (nodeOrEdge instanceof model.domain.Edge) {
                return nodeOrEdge.displayValue("probability");
            }

            return null;
        };

        return {
            math: function (expr) {
                return self.app.expressionEngine.eval(expr, true, {...textInterpolationScope})
            },
            format: function (value, optionsOrMaxFractionDigits) {
                const o = !Utils.isNumber(optionsOrMaxFractionDigits) ?
                    optionsOrMaxFractionDigits :
                    {
                        style: 'decimal',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: optionsOrMaxFractionDigits,
                        useGrouping: false
                    }

                return new Intl.NumberFormat(self.app.config.format.locales, o).format(value);
            },
            mathFormat: function (value, options) {
                return self.app.expressionEngine.format(value, options)
            },
            payoffFormat: payoffFormat,
            probabilityFormat: probabilityFormat,
            getPayoff: getPayoff,
            printPayoff(nodeOrEdge, index) {
                let p = getPayoff(nodeOrEdge);
                if (Utils.isArray(p)) {
                    index = index || 0;
                    p = p[index];
                }

                return payoffFormat(p, index);

            },
            getProbability: getProbability,
            printProbability: function (o) {
                return probabilityFormat(getProbability(o))
            },
            optimalEdges: findOptimalEdges,
            optimalEdge: function (node, index) {
                index = index || 0;
                let optimalList = findOptimalEdges(node);
                return optimalList.length > index ? optimalList[index] : {name: '-'};
            },
            isOptimal: function (nodeOrEdge) {
                return !!nodeOrEdge.displayValue('optimal');
            }
        };
    }

    updateInterpolatedDisplayValues(disableTextInterpolation = false) {
        const self = this;
        if (disableTextInterpolation) {
            self.clearInterpolatedDisplayValues();
            return;
        }

        const globalScope = self.createGlobalScope();


        this.dataModel.nodes.forEach(node => {
            const nodeInterpolationScope = self.createNodeTextInterpolationScope(node, globalScope);
            node.displayValue("name", TextsInterpolator.interpolateText(node.name, nodeInterpolationScope, self.getImports(nodeInterpolationScope), node));

            node.childEdges.forEach(edge => {
                const edgeTextInterpolationScope = TextsInterpolator.copyDisplayValues(edge, {...globalScope, ...node.expressionScope});
                edge.displayValue("name", TextsInterpolator.interpolateText(edge.name, edgeTextInterpolationScope, self.getImports(edgeTextInterpolationScope), edge));
            });
        });

        const textInterpolationScope = {
            ...globalScope
        }

        let textsImports = self.getImports(textInterpolationScope);
        textsImports = {
            ...textsImports,
            payoff: textsImports.getPayoff
        }

        this.dataModel.texts.forEach(text => {
            text.$displayValue = TextsInterpolator.interpolateText(text.value, textInterpolationScope, textsImports);
        });

        this.interpolatedDiagramTitle = TextsInterpolator.interpolateText(this.app.config.title, textInterpolationScope, textsImports);
        this.interpolatedDiagramDescription = TextsInterpolator.interpolateText(this.app.config.description, textInterpolationScope, textsImports);

    }

    createGlobalScope() {
        const self = this;
        const globalObject = Utils.getGlobalObject();
        const globalNames = Object.keys(globalObject);

        const emptyGlobals = {}
        globalNames.forEach(key => emptyGlobals[key] = undefined);

        return {
            ...emptyGlobals,
            ...self.dataModel.expressionScope,
            roots: self.dataModel.getRoots()
        }
    }

    createNodeTextInterpolationScope(node, globalScope) {
        let scope = {
            node: node,
            ...globalScope,
            ...node.expressionScope
        };

        return TextsInterpolator.copyDisplayValues(node, scope, {
            'childrenPayoff': 'payoff',
            'aggregatedPayoff': 'payoff'
        });
    }

    static copyDisplayValues(source, target, nameAliasMap) {
        const booleanNames = ['optimal'];
        source.$DISPLAY_VALUE_NAMES.forEach(n => {
            let val = source.displayValue(n);

            if (booleanNames.includes(n)) {
                val = !!val;
            }

            if (val === undefined || val === null) {
                return;
            }
            if (Utils.isArray(val) && val.length === 1) {
                val = val[0];
            }

            target[n] = val;
            if (nameAliasMap && nameAliasMap.hasOwnProperty(n) && !target.hasOwnProperty(nameAliasMap[n])) {
                target[nameAliasMap[n]] = val;
            }
        });

        return target;
    }

    static interpolateText(text, textInterpolationScope, imports, thisObj = {}) {
        try {
            const compiled = Utils.template(text, {'imports': imports});
            return compiled.call(thisObj, textInterpolationScope);
        } catch (exc) {
            log.debug(`exception interpolating "${text}": ${exc}`)
            return text;
        }
    }

}
