var jsonUrl = getParameterByName('LOAD_SD_TREE_JSON');
var lng = getParameterByName('lang');
var readOnly = getParameterByName('readonly');
readOnly = readOnly ? readOnly.toLowerCase() === 'true' : false;

if(!lng || ['en', 'pl'].indexOf(lng.toLowerCase())<0){
    lng = 'en'
}
var app;
if(jsonUrl){
    getJSON(jsonUrl, function(err, data) {
        if (err != null) {
            alert('Error loading json from url.');
            data = null;
        }
        console.log(data);
        try{
            app = new SilverDecisions('app-container', {lng:lng, readOnly:!!readOnly}, data);
        }catch (e){
            console.log(e);
            app=null;
        }
    });
}

if(!app){
    app = new SilverDecisions('app-container', {lng:lng});
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

function getJSON(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('get', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
        var status = xhr.status;
        if (status == 200) {
            callback(null, xhr.response);
        } else {
            callback(status);
        }
    };
    xhr.send();
}

