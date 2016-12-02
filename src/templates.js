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
            '<div id="export-toolbar-group" class="toolbar-group">'+
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
            '<div id="objective-rule-toolbar-group" class="toolbar-group">'+
                '<label for="objective-rule-select"><%= i18n.t("toolbar.objectiveRule.label")%></label>' +
                '<div class="input-group no-floating-label" style="display: inline-block">' +
                '<select id="objective-rule-select"></select>'+
                '<span class="bar"></span>' +
                '</div>'+
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

    static diagramDetailsBox =
        '<div id="diagram-details-box">' +
            '<div class="header">' +
                '<%= i18n.t("diagramDetails.header")%> ' +
                '<span class="toggle-button">' +
                    '<i class="material-icons icon-arrow-up">keyboard_arrow_up</i>' +
                    '<i class="material-icons icon-arrow-down">keyboard_arrow_down</i>' +
            '</span>' +
            '</div> ' +
            '<div class="content">' +
                '<div class="input-group">' +
                    '<input id="diagram-title" type="text" name="diagram-title">' +
                    '<span class="bar"></span>' +
                    '<label for="diagram-title"><%= i18n.t("diagramDetails.title") %></label>'+
                '</div>' +
                '<div class="input-group">' +
                    '<textarea id="diagram-description" name="diagram-description"></textarea>' +
                    '<span class="bar"></span>' +
                    '<label for="diagram-description"><%= i18n.t("diagramDetails.description") %></label>'+
                '</div>' +
            '</div>'+
        '</div>';

    static sidebar =
        '<div id="sidebar">' +
            '<div id="sidebar-inner">'+
            Templates.layoutOptions+
            Templates.diagramDetailsBox+
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
                    '</form>'+
                '</div>'+
            '</div>'+
        '</div>';

    static settingsDialogFormGroup=
            '<div class="header">' +
                '<h4><%= i18n.t("settingsDialog."+name+".title")%>' +
                    '<span class="toggle-button">' +
                        '<i class="material-icons icon-arrow-up">keyboard_arrow_up</i>' +
                        '<i class="material-icons icon-arrow-down">keyboard_arrow_down</i>' +
                    '</span>' +
                '</h4>' +
            '</div>'+
            '<div class="sd-form-group-content">' +
                '<div class="sd-form-group-inputs"></div>' +
                '<div class="sd-form-group-child-groups"></div>' +
            '</div>';

    static inputGroup=
            '<input id="<%= id %>" type="<%= type %>" name="<%= name %>">' +
            '<span class="bar"></span>' +
            '<label for="<%= id %>"><%= label %></label>';

    static selectInputGroup=
        '<select id="<%= id %>" name="<%= name %>">' +
        '<% for(i=0; i<options.length; ++i) { %>'+
            '<option value="<%= options[i] %>"><%= options[i] %></option>'+
        '<% } %>' +
        '</select>' +
        '<span class="bar"></span>' +
        '<label for="<%= id %>"><%= label %></label>';


    static help = //TODO i18n
        '<div>' +
            '<h3>Help</h3>' +
            '<p>' +
                'Mouse actions:' +
                '<ul>' +
                    '<li>left mouse button: node selection</li>' +
                    '<li>right mouse button: context menu (adding/manipulating nodes)</li>' +
                    '<li>left mouse dbclick on a node: select a subtree</li>' +
                '</ul>' +
            '</p>' +
            '<p>' +
                'Keyboard:' +
                '<ul>' +
                    '<li>Del: delete selected nodes</li>' +
                    '<li>Ctrl-C/X: copy/cut selected nodes</li>' +
                    '<li>Ctrl-V: paste copied nodes as a subtree of a selected node</li>' +
                    '<li>Ctrl-Y/Z: undo/redo</li>' +
                    '<li>Ctrl-Alt-D/C/T: add new Decision/Chance/Terminal subnode of a selected node</li>' +
                '</ul>' +
            '</p>' +
            '<p>Documentation of SilverDecisions is available <a href="https://github.com/bkamins/SilverDecisions/wiki/Documentation" target="_blank">here</a> </p>'+
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
                        '<li><a href="https://szufel.pl/" target="_blank">Przemysław Szufel</a> (deputy project manager)</li>' +
                        '<li><a href="https://github.com/mwasiluk" target="_blank">Michał Wasiluk</a> (developer)</li>' +
                        '<li>Marcin Czupryna (tester)</li>' +
                        '<li><a href="http://www.michaljakubczyk.pl/" target="_blank">Michał Jakubczyk</a> (tester)</p></li>' +
                    '</ul>'+
                    '<p>The project is developed at Decision Support and Analysis Division, Warsaw School of Economics.<br/>Contact: silverdecisions@sgh.waw.pl</p>'+
                    '<p>Software is developed as a part of <a href="http://routetopa.eu/" target="_blank">ROUTE-TO-PA</a> Project that has received funding from the European Union’s Horizon 2020 research and innovation programme under grant agreement No 645860. Its aim is to allow a transparent communication between public administration and citizens regarding public data about decision making processes performed by public administration.</p>' +
                    '<p>All the source files are licensed under the terms of the GNU Lesser General Public License version 3.</p>' +
                    '<p>For more information visit our website at <a href="http://silverdecisions.pl/" target="_blank">http://silverdecisions.pl/</a>.</p>' +
                    Templates.help+
                '</div>'+
            '</div>'+
        '</div>';

    static main =
        '<div id="silver-decisions" tabindex="0">'+
             Templates.toolbar+
            '<div id="main-region">' +
                Templates.sidebar+
                '<div id="tree-designer-container"></div>'+
            '</div>'+
            '<input type="file" style="display:none" id="sd-file-input" accept=".json"/>'+
             Templates.settingsDialog+
             Templates.aboutDialog+
            // '<canvas id="canvas"></canvas>'+
        '</div>';



    static styleRule(selector, props){
        var s = selector+ '{';
        props.forEach(p=> s+=Templates.styleProp(p[0], p[1]));
        s+='} ';
        return s;
    }
    static styleProp(styleName, variableName){
        return  styleName+': <%= '+variableName+' %>; '
    }


    static treeDesignerSelector = '#silver-decisions svg.tree-designer';
    static nodeSelector(type, clazz){
        var s = Templates.treeDesignerSelector+' .node';
        if(type){
            s+='.'+type+'-node';
        }
        if(clazz){
            s+='.'+clazz;
        }
        return s;
    }
    static edgeSelector(clazz){
        var s = Templates.treeDesignerSelector+' .edge';
        if(clazz){
            s+='.'+clazz;
        }
        return s;
    }

    static treeDesignerStyles =

        Templates.styleRule(Templates.treeDesignerSelector,[
            ['font-size', 'fontSize'],
            ['font-family', 'fontFamily'],
            ['font-weight', 'fontWeight'],
            ['font-style', 'fontStyle']
        ])+
        //   node
        Templates.styleRule(Templates.nodeSelector()+' path',[
            ['fill', 'node.fill'],
            ['stroke-width', 'node.strokeWidth']
        ])+
        Templates.styleRule(Templates.nodeSelector('decision', 'optimal')+' path, '+Templates.nodeSelector('chance', 'optimal')+' path,' +Templates.nodeSelector('terminal', 'optimal')+' path',[
            ['stroke', 'node.optimal.stroke'],
            ['stroke-width', 'node.optimal.strokeWidth']
        ])+
        Templates.styleRule(Templates.nodeSelector()+' .label',[
            ['font-size', 'node.label.fontSize'],
            ['fill', 'node.label.color']
        ])+
        Templates.styleRule(Templates.nodeSelector()+' .payoff',[
            ['font-size', 'node.payoff.fontSize'],
            ['fill', 'node.payoff.color'],
        ])+
        Templates.styleRule(Templates.nodeSelector()+' .payoff.negative',[
            ['fill', 'node.payoff.negativeColor'],
        ])+

        //    decision node
        Templates.styleRule(Templates.nodeSelector('decision')+' path',[
            ['fill', 'node.decision.fill'],
            ['stroke', 'node.decision.stroke']
        ])+
        Templates.styleRule(Templates.nodeSelector('decision', 'selected')+' path',[
            ['fill', 'node.decision.selected.fill']
        ])+

        //    chance node
        Templates.styleRule(Templates.nodeSelector('chance')+' path',[
            ['fill', 'node.chance.fill'],
            ['stroke', 'node.chance.stroke']
        ])+
        Templates.styleRule(Templates.nodeSelector('chance', 'selected')+' path',[
            ['fill', 'node.chance.selected.fill']
        ])+

        //    terminal node
        Templates.styleRule(Templates.nodeSelector('terminal')+' path',[
            ['fill', 'node.terminal.fill'],
            ['stroke', 'node.terminal.stroke']
        ])+
        Templates.styleRule(Templates.nodeSelector('terminal', 'selected')+' path',[
            ['fill', 'node.terminal.selected.fill']
        ])+
        Templates.styleRule(Templates.nodeSelector('terminal')+' .aggregated-payoff',[
            ['font-size', 'node.terminal.payoff.fontSize'],
            ['fill', 'node.terminal.payoff.color'],
        ])+
        Templates.styleRule(Templates.nodeSelector('terminal')+' .aggregated-payoff.negative',[
            ['fill', 'node.terminal.payoff.negativeColor'],
        ])+


        //probability
        Templates.styleRule(Templates.treeDesignerSelector+' .node .probability-to-enter, '+Templates.treeDesignerSelector+' .edge .probability',[
            ['font-size', 'probability.fontSize'],
            ['fill', 'probability.color']
        ])+

        //edge
        Templates.styleRule(Templates.edgeSelector()+' path',[
            ['stroke', 'edge.stroke'],
            ['stroke-width', 'edge.strokeWidth']
        ])+
        Templates.styleRule(Templates.treeDesignerSelector+' marker#arrow path',[
            ['fill', 'edge.stroke'],
        ])+
        Templates.styleRule(Templates.edgeSelector('optimal')+' path',[
            ['stroke', 'edge.optimal.stroke'],
            ['stroke-width', 'edge.optimal.strokeWidth']
        ])+
        Templates.styleRule(Templates.treeDesignerSelector+' marker#arrow-optimal path',[
            ['fill', 'edge.optimal.stroke'],
        ])+

        Templates.styleRule(Templates.edgeSelector('selected')+' path',[
            ['stroke', 'edge.selected.stroke'],
            ['stroke-width', 'edge.selected.strokeWidth']
        ])+
        Templates.styleRule(Templates.treeDesignerSelector+' marker#arrow-selected path',[
            ['fill', 'edge.selected.stroke'],
        ])+

        Templates.styleRule(Templates.edgeSelector()+' .label',[
            ['font-size', 'edge.label.fontSize'],
            ['fill', 'edge.label.color']
        ])+

        Templates.styleRule(Templates.edgeSelector()+' .payoff',[
            ['font-size', 'edge.payoff.fontSize'],
            ['fill', 'edge.payoff.color'],
        ])+
        Templates.styleRule(Templates.edgeSelector()+' .payoff.negative',[
            ['fill', 'edge.payoff.negativeColor'],
        ])+

        Templates.styleRule(Templates.treeDesignerSelector+' .sd-title-container text.sd-title',[
            ['font-size', 'title.fontSize'],
            ['font-weight', 'title.fontWeight'],
            ['font-style', 'title.fontStyle'],
            ['fill', 'title.color']
        ]) +
        Templates.styleRule(Templates.treeDesignerSelector+' .sd-title-container text.sd-description',[
            ['font-size', 'description.fontSize'],
            ['font-weight', 'description.fontWeight'],
            ['font-style', 'description.fontStyle'],
            ['fill', 'description.color']
        ])
}




