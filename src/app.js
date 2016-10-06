import * as d3 from './d3'

import {Utils} from './utils'
import * as model from './model/index'

import {TreeDesigner, TreeDesignerConfig} from './tree-designer/tree-designer'
import {DataModel} from './data-model'
import {Templates} from './templates'
import {Sidebar} from './sidebar'
import {Toolbar} from './toolbar'

export class AppConfig {
    width = undefined;
    height = undefined;

    constructor(custom) {
        if (custom) {
            Utils.deepExtend(this, custom);
        }
    }
}

export class App {
    config;
    container;
    dataModel; //Data model manager
    treeDesigner;
    toolbar;
    sidebar;

    constructor(containerId, config) {
        this.setConfig(config);
        this.initContainer(containerId);
        this.initDataModel();
        this.initSidebar();
        this.initTreeDesigner();
        this.initToolbar();
    }

    setConfig(config) {
        if (!config) {
            this.config = new AppConfig();
        } else {
            this.config = config;
        }
        return this;
    }

    initContainer(containerId) {
        this.container = d3.select('#' + containerId);
        this.container.html(Templates.main);
    }

    initDataModel() {
        this.dataModel = new DataModel();
    }

    initSidebar(){
        this.sidebar = new Sidebar(this.container.select('#sidebar'), this);

    }

    initToolbar(){
        this.toolbar = new Toolbar(this.container.select('#toolbar'), this);

    }

    initTreeDesigner() {
        var self=this;
        var config = {
            onNodeSelected: function(node){
                self.onObjectSelected(node);
            },
            onEdgeSelected: function(edge){
                self.onObjectSelected(edge);
            },
            onSelectionCleared: function(){
                self.onSelectionCleared();
            }
        };
        this.treeDesigner = new TreeDesigner(this.container.select('#tree-designer-container'), this.dataModel,config);
    }
    onObjectSelected(object){
        var self = this;
        if(this.selectedObject===object){
            return;
        }
        this.selectedObject = object;
        setTimeout(function(){
            self.sidebar.updateObjectPropertiesView(self.selectedObject);
        },10)

    }

    onSelectionCleared(){
        this.selectedObject=null;
        this.sidebar.hideObjectProperties();
        // console.log();
    }

    updateView(){
        this.treeDesigner.redraw(true);
        this.sidebar.updateObjectPropertiesView(this.selectedObject);
    }

    undo(){
        var self = this;
        self.dataModel.undo();
        if(self.selectedObject){
            self.selectedObject = self.dataModel.findById(self.selectedObject.$id);
        }

        self.updateView();
    }

    redo(){
        var self = this;
        self.dataModel.redo();
        if(self.selectedObject){
            self.selectedObject = self.dataModel.findById(self.selectedObject.$id);
        }
        self.updateView();
    }

}
