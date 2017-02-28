var app = new SilverDecisions.App('app-container');

document.addEventListener('SilverDecisionsSaveEvent', function(data){
    console.log(data);
});
