import *  as _ from 'lodash'
import {i18n} from './i18n/i18n'
//TODO maybe use some templating engine instead
export class Templates{


    static get(templateName, variables){
        var compiled = _.template(Templates[templateName],{ 'imports': { 'i18n': i18n } });
        return compiled(variables)

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
                '<button id="undoButton" class="icon-button" disabled="disabled" title="<%= i18n.t("toolbar.undo")%>"><i class="material-icons">undo</i></button>'+
                '<button id="redoButton" class="icon-button" disabled="disabled" title="<%= i18n.t("toolbar.redo")%>"><i class="material-icons">redo</i></button>'+
            '</div>'+
            '<div class="toolbar-group">'+
                '<button id="settings-button" class="icon-button" title="<%= i18n.t("toolbar.settings")%>"><i class="material-icons">settings</i></button>'+
                '<button id="about-button" class="icon-button" title="<%= i18n.t("toolbar.about")%>"><i class="material-icons">info_outline</i></button>'+
            '</div>'+
        '</div>';

    static layoutOptions =
        '<div id="layout-options">' +
            '<div class="header">' +
                '<%= i18n.t("layoutOptions.header")%> ' +
                '<span class="toggle-button">' +
                    '<i class="material-icons icon-arrow-up">keyboard_arrow_up</i>' +
                    '<i class="material-icons icon-arrow-down">keyboard_arrow_down</i>' +
                '</span>' +
            '</div> '+
            '<div class="content">' +
                '<div class="input-group">' +
                    '<input id="margin-horizontal" name="margin-horizontal" type="range" min="5" max="150" step="5" />' +
                    '<label for="margin-horizontal"><%= i18n.t("layoutOptions.marginHorizontal")%></label>' +
                '</div>' +
                '<div class="input-group">' +
                    '<input id="margin-vertical" name="margin-vertical" type="range" min="5" max="150" step="5" />' +
                    '<label for="margin-vertical"><%= i18n.t("layoutOptions.marginVertical")%></label>' +
                '</div>' +
                '<div class="input-group">' +
                    '<input id="node-size" name="node-size" type="range" min="20" max="60" step="5" />' +
                    '<label for="node-size"><%= i18n.t("layoutOptions.nodeSize")%></label>' +
                '</div>' +
                '<div class="input-group">' +
                    '<input id="edge-slant-width-max" name="edge-slant-width-max" type="range" min="0" max="150" step="5" />' +
                    '<label for="edge-slant-width-max"><%= i18n.t("layoutOptions.edgeSlantWidthMax")%></label>' +
                '</div>' +
                '<div id="auto-layout-options">' +
                    '<div class="input-group">' +
                        '<input id="grid-width" name="grid-width" type="range" min="105" max="300" step="5" />' +
                        '<label for="grid-width"><%= i18n.t("layoutOptions.gridWidth")%></label>' +
                    '</div>' +
                    '<div class="input-group">' +
                        '<input id="grid-height" name="grid-height" type="range" min="55" max="150" step="5" />' +
                        '<label for="grid-height"><%= i18n.t("layoutOptions.gridHeight")%></label>' +
                    '</div>' +
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

    static aboutDialog =
        '<div id="sd-about-dialog" class="sd-modal">'+
            '<div class="sd-modal-content">'+
                '<div class="sd-modal-header">'+
                    '<span class="sd-close-modal"><i class="material-icons">close</i></span>'+
                    '<h2><%= i18n.t("aboutDialog.title")%></h2>'+
                '</div>'+
                '<div class="sd-modal-body">'+
                    '<p><strong>SilverDecisions <%= version %></strong><br/>A free and open source decision tree software.</p>' +
                    '<p class="sd-project-team">Project team:' +
                    '<ul>' +
                        '<li><a href="http://bogumilkaminski.pl/" target="_blank">Bogumił Kamiński</a> (project manager)</li>' +
                        '<li><a href="http://akson.sgh.waw.pl/~pszufe/" target="_blank">Przemysław Szufel</a> (deputy project manager)</li>' +
                        '<li><a href="https://github.com/mwasiluk" target="_blank">Michał Wasiluk</a> (developer)</li>' +
                        '<li>Marcin Czupryna (tester)</li>' +
                        '<li><a href="http://www.michaljakubczyk.pl/" target="_blank">Michał Jakubczyk</a> (tester)</p></li>' +
                    '</ul>'+
                    '<p>The project is developed at Decision Support and Analysis Division, Warsaw School of Economics.<br/>Contact: silverdecisions@sgh.waw.pl</p>'+
                    '<p>Software is developed as a part of <a href="http://routetopa.eu/">ROUTE-TO-PA</a> Project that has received funding from the European Union’s Horizon 2020 research and innovation programme under grant agreement No 645860. Its aim is to allow a transparent communication between public administration and citizens regarding public data about decision making processes performed by public administration.</p>' +
                    '<p>All the source files are licensed under the terms of the GNU General Public License version 3.</p>' +
                    '<p>For more information visit our website at <a href="http://silverdecisions.pl/">http://silverdecisions.pl/</a>.</p>' +
                    '<p>Documentation of SilverDecisions is available <a href="https://github.com/bkamins/SilverDecisions/wiki/Documentation">here</a> </p>'+
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
            '<input type="file" style="display:none" id="sd-file-input" accept=".json"/>'+
             Templates.settingsDialog+
             Templates.aboutDialog+
        '</div>';
}




