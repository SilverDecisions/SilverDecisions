var lng = getParameterByName('lang') || 'en';
var app;

var data = SilverDecisions.App.appUtils.getJSON("./data/rockefellerWithParams.json", function(data, err){
    app = new SilverDecisions.App('app-container', {
        lng: lng,
        readOnly: false,
        logLevel: 'debug',
        workerUrl: "job-worker.js",
        // jobRepositoryType: 'timeout',
        buttons:{
            new: true,
            save: true,
            open: true,
            exportToPng: true,
            exportToSvg: true,
        },
        showExport: true,
        showDetails: true,
        jsonFileDownload: true,
        treeDesigner:{
            description:{
                show: true
            }
        }
    }, data);

});

document.addEventListener('SilverDecisionsSaveEvent', function(data){
    console.log(data);
});


function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
