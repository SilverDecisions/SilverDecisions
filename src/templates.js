import {Templates as TdTemplates} from "sd-tree-designer";
import {i18n} from './i18n/i18n'
import {Utils, log} from "sd-utils";

export class Templates extends TdTemplates{

    //TODO automate
    static about_de = require('./templates/about/de.html');
    static about_en = require('./templates/about/en.html');
    static about_fr = require('./templates/about/fr.html');
    static about_it = require('./templates/about/it.html');
    static about_pl = require('./templates/about/pl.html');

    static toolbar = require('./templates/toolbar.html');
    static layoutOptions = require('./templates/sidebar/layout_options.html');
    static objectProperties = require('./templates/sidebar/object_properties.html');
    static diagramDetailsBox = require('./templates/sidebar/diagram_details_box.html');
    static evaluatedVariables = require('./templates/evaluated_variables.html');
    static definitions = require('./templates/sidebar/definitions.html');
    static multipleCriteria = require('./templates/sidebar/multiple_criteria.html');
    static sidebar = require('./templates/sidebar/sidebar.html');
    static settingsDialog = require('./templates/settings_dialog.html');
    static settingsDialogFormGroup = require('./templates/settings_dialog_form_group.html');
    static inputGroup = require('./templates/input_group.html');
    static selectInputGroup = require('./templates/select_input_group.html');
    static help = require('./templates/help.html');
    static aboutDialog = require('./templates/about_dialog.html');
    static definitionsDialog = require('./templates/definitions_dialog.html');
    static sensitivityAnalysisDialog = require('./templates/sensitivity_analysis_dialog.html');
    static jobParametersBuilder = require('./templates/jobs/job_parameters_builder.html');
    static jobParameter = require('./templates/jobs/job_parameter.html');
    static leagueTableDialog = require('./templates/league_table_dialog.html');
    static loadingIndicator = require('./templates/loading_indicator.html');
    static fullscreenPopup = require('./templates/fullscreen_popup.html');
    static warningMessage = require('./templates/warning_message.html');
    static main = require('./templates/main.html');

    static get(templateName, variables){
        var compiled = Utils.template(Templates[templateName],{ 'imports': { 'i18n': i18n, 'Templates': Templates, 'include': function(n, v) {return Templates.get(n, v)} } });
        if(variables){
            variables.variables = variables;
        }else{
            variables = {variables:{}}
        }
        return compiled(variables)

    }

}




