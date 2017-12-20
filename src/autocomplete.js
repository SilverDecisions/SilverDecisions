import {Utils} from "sd-utils";
import {AppUtils} from "./app-utils";
var $ = require('jquery');
var global$ = Utils.getGlobalObject().jQuery;
Utils.getGlobalObject().jQuery = $;
require('jquery-ui/ui/data');
require('jquery-ui/ui/widget');
require('jquery-ui/ui/widgets/mouse');
require('jquery-ui/ui/widgets/button');
require('jquery-ui/ui/widgets/menu');
require('jquery-ui/ui/unique-id');
require('jquery-ui/ui/position');
require('jquery-ui/ui/keycode');
require('jquery-ui/ui/safe-active-element');
require('jquery-ui/ui/widgets/autocomplete');
Utils.getGlobalObject().jQuery = global$;

import * as d3 from './d3'

$( function() {
    $.widget( "sd.combobox", {
        _create: function() {
            this.wrapper = $( "<span>" )
                .addClass( "sd-combobox" )
                .insertAfter( this.element );

            this.element.hide();
            this._createAutocomplete();
            this._createShowAllButton();
        },

        _createAutocomplete: function() {
            var selected = this.element.children( ":selected" ),
                value = selected.val() ? selected.text() : "";

            this.input = $( "<input>" )
                .appendTo( this.wrapper )
                .val( value )
                .attr( "title", "" )
                .attr( "type", "text" )
                .addClass( "sd-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left" )
                .autocomplete({
                    delay: 0,
                    minLength: 0,
                    source: $.proxy( this, "_source" ),
                    classes: {
                        "ui-autocomplete": "sd-combobox-autocomplete"
                    }
                });
            $( "<span class='bar'>" ).appendTo( this.wrapper )

            var input = this.input;
            this._on( this.input, {
                autocompleteselect: function( event, ui ) {
                    ui.item.option.selected = true;
                    this._trigger( "select", event, {
                        item: ui.item.option
                    });

                },

                autocompletechange: function(){
                    let inputD3 = d3.select($(input).get(0));
                    AppUtils.dispatchHtmlEvent(inputD3.node(), "change");
                }
            });
        },

        _createShowAllButton: function() {
            var input = this.input,
                wasOpen = false;

            $( "<button>" )
                .attr( "tabIndex", -1 )
                .attr( "type", "button" )
                .html('<i class="material-icons">arrow_drop_down</i>')
                .appendTo( this.wrapper )
                .addClass( "sd-combobox-toggle ui-corner-right" )
                .on( "mousedown", function() {
                    wasOpen = input.autocomplete( "widget" ).is( ":visible" );
                })
                .on( "click", function() {
                    input.trigger( "focus" );
                    // Close if already visible
                    if ( wasOpen ) {
                        return;
                    }

                    // Pass empty string as value to search for, displaying all results
                    input.autocomplete( "search", "" );
                });
        },

        _source: function( request, response ) {
            var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
            response( this.element.children( "option" ).map(function() {
                var text = $( this ).text();
                if ( this.value && ( !request.term || matcher.test(text) ) )
                    return {
                        label: text,
                        value: text,
                        option: this
                    };
            }) );
        },

        _destroy: function() {
            this.wrapper.remove();
            this.element.show();
        },

        input_element: function(){
            return this.input;
        }
    });
} );

export class Autocomplete{


    constructor(container){
        this.container= container;
        this.combobox = $( this.container.node() ).combobox();
    }

    getInput(){
        return d3.select($(this.combobox).combobox('input_element').get(0))
    }

}
