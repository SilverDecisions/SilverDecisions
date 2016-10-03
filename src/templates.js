
//TODO maybe use some templating engine instead
export class Templates{

    static toolbar =
        '<div id="toolbar">' +
            '<button id="saveButton" class="mdl-button mdl-js-button mdl-button--raised">Export to PNG</button>'+
            '<button id="saveButtonSvg">Export to SVG</button>'+
            '<button id="treeAutoLayoutButton">Tree auto layout</button>'+
            '<button id="clusterAutoLayoutButton">Cluster auto layout</button>'+
        '</div>';

    static main =
        '<div id="silver-decisions">'+
            Templates.toolbar+
            '<div id="tree-designer-container"></div>'+
        '</div>';

}




