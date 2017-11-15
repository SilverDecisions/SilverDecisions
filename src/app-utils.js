import * as d3 from "./d3";
import * as autosize from "autosize";
import {Templates} from "./templates";
import {i18n} from "./i18n/i18n";
import {Utils} from "sd-utils";
import {AppUtils as TdUtils} from "sd-tree-designer";

export class AppUtils extends TdUtils{



    static updateInputClass(selection){
        var value = selection.node().value;
        selection.classed('empty', value!==0 && !value);
        return selection;
    }

    static autoResizeTextarea(element){
        setTimeout(function(){
            element.style.width = "";
            var width = element.getBoundingClientRect().width;
            if(width){
                element.style.width = width+'px';
            }
            autosize.update(element);
        }, 10);
    }

    static elasticTextarea(selection){
        setTimeout(function(){
            selection.style('width',undefined);
            var width = selection.node().getBoundingClientRect().width;
            if(width){
                selection.style('width', width+'px')
            }
            autosize.default(selection.node());
        },10)
    }

    static postByForm(url, data) {
        var name,
            form;

        // create the form
        form = AppUtils.createElement('form', AppUtils.mergeDeep({
            method: 'post',
            action: url,
            enctype: 'multipart/form-data'
        }), document.body);

        for (name in data) {
            if(data.hasOwnProperty(name)){
                AppUtils.createElement('input', {
                    type: 'hidden',
                    name: name,
                    value: data[name]
                }, form);
            }
        }

        form.submit();

        AppUtils.removeElement(form);
    };

    static showFullScreenPopup(title, html, closeCallback){
        var popup = d3.select("body").selectOrAppend("div.sd-full-screen-popup-container").html(Templates.get('fullscreenPopup', {title:title,body:html}));
        popup.select('.sd-close-popup').on('click', ()=>{
            popup.remove();
            if(closeCallback) {
                closeCallback()
            }
        })

    }
}
