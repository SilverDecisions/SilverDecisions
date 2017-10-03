import i18next from 'i18next';
import * as en from './en.json'
import * as pl from './pl.json'
import * as it from './it.json'
import * as de from './de.json'
import * as fr from './fr.json'

export class i18n{

    static $instance;
    static language;

    static init(lng){
        i18n.language = lng;
        i18n.$instance = i18next.createInstance({
            lng: lng,
            fallbackLng: 'en',
            resources: {
                en: {
                    translation: en
                },
                pl: {
                    translation: pl
                },
                it: {
                    translation: it
                },
                de: {
                    translation: de
                },
                fr: {
                    translation: fr
                }
            }
        }, (err, t) => {
        });
    }

    static t(key, opt){
        return i18n.$instance.t(key, opt)
    }
}
