var app = new SilverDecisions.App('app-container',{
    workerUrl: "job-worker.js",
});

document.addEventListener('SilverDecisionsSaveEvent', function(data){
    console.log(data);
});
