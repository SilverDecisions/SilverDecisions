import {ExpressionEngine} from "../expression-engine/expression-engine";
import * as model from '../model/index'
import * as _ from "lodash";
import * as log from "../log"
import {Utils} from "../utils";
import {ObjectiveRulesManager} from "./objective/objective-rules-manager";
import {TreeValidator} from "./validation/tree-validator";
import {OperationsManager} from "./operations/operations-manager";


export class ComputationsManager {
    data;
    expressionEngine;

    objectiveRulesManager;
    operationsManager;
    jobsManger;

    treeValidator;

    mode;

    constructor(currentRuleName, data, expressionEngine){
        this.data = data;
        this.expressionEngine = expressionEngine;
        this.objectiveRulesManager = new ObjectiveRulesManager(currentRuleName, this.data, this.expressionEngine);
        this.operationsManager = new OperationsManager(this.data, this.expressionEngine);
        this.treeValidator = new TreeValidator(this.expressionEngine);
        this.mode = this.objectiveRulesManager;
    }

    registerMode(mode){

    }

    getCurrentRule(){
        return this.objectiveRulesManager.currentRule;
    }

    getObjectiveRules(){
        return this.objectiveRulesManager.rules;
    }

    isRuleName(ruleName){
        return this.objectiveRulesManager.isRuleName(ruleName)
    }

    setCurrentRuleByName(ruleName){
        return this.objectiveRulesManager.setCurrentRuleByName(ruleName)
    }

    operationsForObject(object){
        return this.operationsManager.operationsForObject(object);
    }

    checkValidityAndRecomputeObjective(allRules, evalCode=false, evalNumeric=true) {
        this.data.validationResults = [];

        if(evalCode||evalNumeric){
            this.evalExpressions(evalCode, evalNumeric);
        }

        this.data.getRoots().forEach(root=> {
            var vr = this.treeValidator.validate(this.data.getAllNodesInSubtree(root));
            this.data.validationResults.push(vr);
            if (vr.isValid()) {
                this.objectiveRulesManager.recomputeTree(root, allRules);
            }
        });
        this.updateDisplayValues();
    }

    clearTree(root){
        this.data.getAllNodesInSubtree(root).forEach(n=>{
            n.clearComputedValues();
            n.childEdges.forEach(e=>{
                e.clearComputedValues();
            })
        })
    }

    updateDisplayValues() {
        this.data.nodes.forEach(n=>{
            this.updateNodeDisplayValues(n);
        });
        this.data.edges.forEach(e=>{
            this.updateEdgeDisplayValues(e);
        })
    }

    updateNodeDisplayValues(node){
        node.$DISPLAY_VALUE_NAMES.forEach(n=>node.displayValue(n,this.mode.getNodeDisplayValue(node, n)));
    }

    updateEdgeDisplayValues(e){
        e.$DISPLAY_VALUE_NAMES.forEach(n=>e.displayValue(n,this.mode.getEdgeDisplayValue(e, n)));
    }

    evalExpressions(evalCode=true, evalNumeric=true, initScopes=false){
        log.debug('evalExpressions evalCode:'+evalCode+' evalNumeric:'+evalNumeric);
        if(evalCode){
            this.data.clearExpressionScope();
            this.data.$codeDirty = false;
            try{
                this.data.$codeError = null;
                this.expressionEngine.eval(this.data.code, false, this.data.expressionScope);
            }catch (e){
                this.data.$codeError = e;
            }
        }

        this.data.getRoots().forEach(n=>{
            this.clearTree(n);
            this.evalExpressionsForNode(n, evalCode, evalNumeric,initScopes);
        });

    }

    evalExpressionsForNode(node, evalCode=true, evalNumeric=true, initScope=false) {
        if(!node.expressionScope || initScope || evalCode){
            this.initScopeForNode(node);
        }
        if(evalCode){
            node.$codeDirty = false;
            if(node.code){
                try{
                    node.$codeError = null;
                    this.expressionEngine.eval(node.code, false, node.expressionScope);
                }catch (e){
                    node.$codeError = e;
                    log.debug(e);
                }
            }
        }

        if(evalNumeric){
            var scope = node.expressionScope;
            var probabilitySum=ExpressionEngine.toNumber(0);
            var hashEdges= [];
            var invalidProb = false;

            node.childEdges.forEach(e=>{
                if(e.isFieldValid('payoff', true, false)){
                    try{
                        e.computedValue(null, 'payoff', this.expressionEngine.evalPayoff(e))
                    }catch (err){
                        //   Left empty intentionally
                    }
                }

                if(node instanceof model.ChanceNode){
                    if(ExpressionEngine.isHash(e.probability)){
                        hashEdges.push(e);
                        return;
                    }

                    if(ExpressionEngine.hasAssignmentExpression(e.probability)){ //It should not occur here!
                        log.warn("evalExpressionsForNode hasAssignmentExpression!", e);
                        return null;
                    }

                    if(e.isFieldValid('probability', true, false)){
                        try{
                            var prob = this.expressionEngine.eval(e.probability, true, scope);
                            e.computedValue(null, 'probability', prob);
                            probabilitySum = ExpressionEngine.add(probabilitySum, prob);
                        }catch (err){
                            invalidProb = true;
                        }
                    }else{
                        invalidProb = true;
                    }
                }

            });


            if(node instanceof model.ChanceNode){
                var computeHash = hashEdges.length && !invalidProb && (probabilitySum.compare(0) >= 0 && probabilitySum.compare(1) <= 0);

                if(computeHash) {
                    var hash = ExpressionEngine.divide(ExpressionEngine.subtract(1, probabilitySum), hashEdges.length);
                    hashEdges.forEach(e=> {
                        e.computedValue(null, 'probability', hash);
                    });
                }
            }

            node.childEdges.forEach(e=>{
                this.evalExpressionsForNode(e.childNode, evalCode, evalNumeric, initScope);
            });
        }
    }

    initScopeForNode(node){
        var parent = node.$parent;
        var parentScope = parent?parent.expressionScope : this.data.expressionScope;
        node.expressionScope = _.cloneDeep(parentScope);
    }
}
