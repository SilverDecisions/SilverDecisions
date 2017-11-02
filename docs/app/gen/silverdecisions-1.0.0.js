var jsonUrl = getParameterByName('LOAD_SD_TREE_JSON');
var lng = getParameterByName('lang');
var readOnly = getParameterByName('readonly');
var logLevel = getParameterByName('loglevel');
readOnly = readOnly ? readOnly.toLowerCase() === 'true' : false;

if(!lng || ['en', 'pl', 'it', 'de', 'fr'].indexOf(lng.toLowerCase())<0){
    lng = 'en';
}
if(!logLevel || ['debug', 'info', 'warn', 'error'].indexOf(logLevel.toLowerCase())<0){
    logLevel = 'warn';
}

var config = {
    lng:lng,
    readOnly:!!readOnly,
    workerUrl: './app/gen/silverdecisions-job-worker-1.0.0.js',
    logLevel: logLevel,
    treeDesigner:{
    }
};
var edgeOrIE = SilverDecisions.App.utils.detectEdge() || SilverDecisions.App.utils.detectIE();
if(edgeOrIE){ //There are some problems with worker on Edge and IE
    config.workerUrl = null;
    config.jobRepositoryType = 'timeout'
}

if(SilverDecisions.App.utils.detectIE()=='11'){ // IE 11
    if(platform.os.family.toLowerCase().indexOf('windows') !== -1){ // on Windows
        var osVersion = platform.os.version.toLowerCase();
        if(osVersion == '7' || osVersion.indexOf('windows server 2008') !== -1){
            SilverDecisions.App.growl('Sorry, your platform is not fully supported (Internet Explorer 11 on Windows 7)', 'warning', 'right', 5000);
            config.treeDesigner.disableAnimations=true;
            config.treeDesigner.forceFullEdgeRedraw=true;
        }

    }
}



var app;
if(jsonUrl){
    SilverDecisions.App.appUtils.getJSON(jsonUrl, function(data, err) {
        if (err != null) {
            alert('Error loading json from url.');
            data = null;
        }
        console.log(data);
        try{

            app = new SilverDecisions.App('app-container', config, data);
        }catch (e){
            console.log(e);
            app = new SilverDecisions.App('app-container', config);
        }
    });
}else{
    app = new SilverDecisions.App('app-container', config);
}

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



