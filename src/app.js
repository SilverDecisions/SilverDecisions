import * as d3 from './d3'

import {Utils} from './utils'
import * as model from './model/index'
import {Exporter} from './exporter'
import {TreeDesigner, TreeDesignerConfig} from './tree-designer'
import {DataModel} from './data-model'


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

    constructor(containerId, config){
        this.setConfig(config);
        this.initContainer(containerId);
        this.initDataModel();
        this.initTreeDesigner();
        this.initExportToPngButton();
        this.initExportSvgButton();
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
        this.container = d3.select('#'+containerId);
    }

    initDataModel() {
        this.dataModel = new DataModel();
    }

    initTreeDesigner(){
        this.treeDesigner = new TreeDesigner(this.container, this.dataModel);
    }
    

    initExportToPngButton() {
        var svg = this.treeDesigner.svg;
        d3.select('#saveButton').on('click', function(){
            var svgString = Exporter.getSVGString(svg.node());
            Exporter.svgString2Image(svgString, 2*800, 2*800, 'png', save ); // passes Blob and filesize String to the callback

            function save(dataBlob,filesize){
                Exporter.saveAs(dataBlob,'export.png'); 
            }
        });
    }

    initExportSvgButton() {
        var svg = this.treeDesigner.svg;
        d3.select('#saveButtonSvg').on('click', function(){
            var svgString = Exporter.getSVGString(svg.node());
            var blob = new Blob([svgString], {type: "image/svg+xml"});
            Exporter.saveAs(blob,'export.svg');
        });
    }
}
