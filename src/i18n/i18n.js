import i18next from 'i18next';
import * as en from './en.json'
import * as pl from './pl.json'

export class i18n{

    static init(lng){
        var self = this;
        i18next.init({
            lng: lng,
            resources: {
                en: {
                    translation: en
                },
                pl: {
                    translation: pl
                }
            }
        }, (err, t) => {
        });
    }

    static t(key, opt){
        return i18next.t(key, opt)
    }
}
