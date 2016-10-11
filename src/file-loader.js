
export class FileLoader{

    static openFile(callback){
        var input =  document.getElementById('sd-file-input');
        input.onchange = loadFile;

        input.click();

        function loadFile() {

             var file, fr;


            if (typeof window.FileReader !== 'function') {
                alert("The file API isn't supported on this browser yet.");
                return;
            }
            input =  document.getElementById('sd-file-input');
            if (!input.files) {
                alert("This browser doesn't seem to support the `files` property of file inputs.");
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
                var fileContent = JSON.parse(e.target.result);
                callback(fileContent);
                input.value = null;
            }
        }
    }

}
