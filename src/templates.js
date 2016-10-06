
//TODO maybe use some templating engine instead
export class Templates{

    static toolbar =
        '<div id="toolbar">' +
            '<button id="saveButton" class="mdl-button mdl-js-button mdl-button--raised">Export to PNG</button>'+
            '<button id="saveButtonSvg">Export to SVG</button>'+
            '<button id="treeAutoLayoutButton">Tree auto layout</button>'+
            '<button id="clusterAutoLayoutButton">Cluster auto layout</button>'+
            '<button id="undoButton" disabled="disabled" title="undo"><i class="material-icons">undo</i></button>'+
            '<button id="redoButton" disabled="disabled" title="redo"><i class="material-icons">redo</i></button>'+
        '</div>';



    static nodeProperties =
        '<div id="object-properties">' +
            '<div class="header"></div> '+
            '<div class="content"></div> '+
        '</div>';
    static sidebar =
        '<div id="sidebar">' +
        Templates.nodeProperties+
        '</div>';

    static main =
        '<div id="silver-decisions">'+

        Templates.toolbar+
        '<div id="main-region">' +
        Templates.sidebar+
        '<div id="tree-designer-container"></div>'+
        '</div>'+

        '</div>';
}




