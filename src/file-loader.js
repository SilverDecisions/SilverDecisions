import {i18n} from './i18n/i18n'

export class FileLoader{

    static openFile(callback){
        var input =  document.getElementById('sd-file-input');
        input.onchange = loadFile;

        input.click();

        function loadFile() {

             var file, fr;


            if (typeof window.FileReader !== 'function') {
                alert(i18n.t('error.fileApiNotSupported'));
                return;
            }
            input =  document.getElementById('sd-file-input');
            if (!input.files) {
                alert(i18n.t('error.inputFilesProperty'));
                return;
            }

            if (!input.files[0]) {
                return;
            }

            file = input.files[0];
            fr = new FileReader();
            fr.onload = receivedText;
            fr.readAsText(file);


            function receivedText(e) {
                callback(e.target.result);
                input.value = null;
            }
        }
    }

}
