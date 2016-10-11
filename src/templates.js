import *  as _ from 'lodash'
import {i18n} from './i18n/i18n'
//TODO maybe use some templating engine instead
export class Templates{


    static get(templateName){
        var compiled = _.template(Templates[templateName],{ 'imports': { 'i18n': i18n } });
        return compiled()

    }

    static toolbar =
        '<div id="toolbar">' +
            '<button id="saveButton" class="mdl-button mdl-js-button mdl-button--raised"><%= i18n.t("toolbar.exportToPng")%></button>'+
            '<button id="saveButtonSvg"><%= i18n.t("toolbar.exportToSvg")%></button>'+
            '<button id="treeAutoLayoutButton">Tree auto layout</button>'+
            '<button id="clusterAutoLayoutButton">Cluster auto layout</button>'+
            '<button id="undoButton" disabled="disabled" title="<%= i18n.t("toolbar.undo")%>"><i class="material-icons">undo</i></button>'+
            '<button id="redoButton" disabled="disabled" title="<%= i18n.t("toolbar.redo")%>"><i class="material-icons">redo</i></button>'+
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




