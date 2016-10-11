import i18next from 'i18next';
import * as en from './en'

export class i18n{

    static init(lng){
        var self = this;
        i18next.init({
            lng: lng,
            resources: {
                en: {
                    translation: en
                }
            }
        }, (err, t) => {
        });
    }

    static t(key){
        return i18next.t(key)
    }
}
