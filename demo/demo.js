var app = new SilverDecisions('app-container');

document.addEventListener('SilverDecisionsSaveEvent', function(data){
    console.log(data);
});
