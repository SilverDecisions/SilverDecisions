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
            '<div class="toolbar-group">'+
                '<button id="new-diagram-button" class="icon-button" title="<%= i18n.t("toolbar.newDiagram")%>"><i class="material-icons">insert_drive_file</i></button>'+
                '<button id="open-diagram-button" class="icon-button" title="<%= i18n.t("toolbar.openDiagram")%>"><i class="material-icons">folder_open</i></button>'+
                '<button id="save-diagram-button" class="icon-button" title="<%= i18n.t("toolbar.saveDiagram")%>"><i class="material-icons">save</i></button>'+
            '</div>'+
            '<div class="toolbar-group">'+
                '<label><%= i18n.t("toolbar.export.label")%></label>'+
                '<button id="saveButton"><%= i18n.t("toolbar.export.png")%></button>'+
                '<button id="saveButtonSvg"><%= i18n.t("toolbar.export.svg")%></button>'+
            '</div>'+
            '<div class="toolbar-group">'+
                '<label><%= i18n.t("toolbar.layout.label")%></label>'+
                '<button id="manualLayoutButton"><%= i18n.t("toolbar.layout.manual")%></button>'+
                '<button id="treeAutoLayoutButton"><%= i18n.t("toolbar.layout.tree")%></button>'+
                '<button id="clusterAutoLayoutButton"><%= i18n.t("toolbar.layout.cluster")%></button>'+
            '</div>'+
            '<div class="toolbar-group">'+
                '<button id="undoButton" disabled="disabled" title="<%= i18n.t("toolbar.undo")%>"><i class="material-icons">undo</i></button>'+
                '<button id="redoButton" disabled="disabled" title="<%= i18n.t("toolbar.redo")%>"><i class="material-icons">redo</i></button>'+
            '</div>'+
            '<div class="toolbar-group">'+
                '<button id="settings-button" title="<%= i18n.t("toolbar.settings")%>"><i class="material-icons">settings</i></button>'+
            '</div>'+
        '</div>';


    static layoutOptions =
        '<div id="layout-options">' +
            '<div class="header"><%= i18n.t("layoutOptions.header")%></div> '+
            '<div class="content">' +
                '<div class="input-group">' +
                    '<input id="grid-width" name="grid-width" type="range" min="105" max="300" step="5" />' +
                    '<label for="grid-width"><%= i18n.t("layoutOptions.gridWidth")%></label>' +
                '</div>' +
                '<div class="input-group">' +
                    '<input id="grid-height" name="grid-height" type="range" min="55" max="150" step="5" />' +
                    '<label for="grid-height"><%= i18n.t("layoutOptions.gridHeight")%></label>' +
                '</div>' +
            '</div>' +
        '</div>';

    static objectProperties =
        '<div id="object-properties">' +
            '<div class="header"></div> '+
            '<div class="content">' +
                '<div class="main-properties"></div> '+
                '<div class="children-properties">' +
                    '<div class="children-properties-header"></div> '+
                    '<div class="children-properties-content"></div>' +
                '</div> '+
            '</div> '+
        '</div>';
    static sidebar =
        '<div id="sidebar">' +
            '<div id="sidebar-inner">'+
            Templates.layoutOptions+
            Templates.objectProperties+
            '</div>'+
        '</div>';

    static settingsDialog =
        '<div id="sd-settings-dialog" class="sd-modal">'+
            '<div class="sd-modal-content">'+
                '<div class="sd-modal-header">'+
                    '<span class="sd-close-modal"><i class="material-icons">close</i></span>'+
                    '<h2><%= i18n.t("settingsDialog.title")%></h2>'+

                '</div>'+
                '<div class="sd-modal-body">'+
                    '<form id="sd-settings-form">'+
                        '<h4><%= i18n.t("settingsDialog.payoff.title")%></h4>'+
                        '<div class="sd-form-group">' +
                            '<label for="sd-payoff-currency"><%= i18n.t("settingsDialog.payoff.currency")%></label>' +
                            '<input type="text" id="sd-payoff-currency" name="payoff-currency">' +
                        '</div> '+
                        '<div class="sd-form-group">' +
                            '<label for="sd-payoff-minimumFractionDigits"><%= i18n.t("settingsDialog.payoff.minimumFractionDigits")%></label>' +
                            '<input type="number" id="sd-payoff-minimumFractionDigits" name="payoff-minimumFractionDigits">' +
                        '</div> '+
                        '<div class="sd-form-group">' +
                            '<label for="sd-payoff-maximumFractionDigits"><%= i18n.t("settingsDialog.payoff.maximumFractionDigits")%></label>' +
                            '<input type="number" id="sd-payoff-maximumFractionDigits" name="payoff-maximumFractionDigits">' +
                        '</div> '+
                    '</form>'+
                '</div>'+
            '</div>'+
        '</div>';



    static main =
        '<div id="silver-decisions">'+
             Templates.toolbar+
            '<div id="main-region">' +
                Templates.sidebar+
                '<div id="tree-designer-container"></div>'+
            '</div>'+
            '<input type="file" style="display:none" id="sd-file-input"/>'+
             Templates.settingsDialog+
        '</div>';
}




