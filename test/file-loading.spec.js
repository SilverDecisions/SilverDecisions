describe("JSON file", function() {
    var containerId = 'container';
    var container;
    var app;
    var fixtures = jasmine.getFixtures();
    fixtures.fixturesPath = "base/test/";
    var fileList = JSON.parse(readFixtures("tree-json-filelist.json"));
    fixtures.fixturesPath = "base/test/trees";

    beforeEach(function() {
        $('body').empty();
        container = document.createElement("div");
        container.id = containerId;
        document.getElementsByTagName('body')[0].appendChild(container);
        app = new SilverDecisions(containerId);
    });

    fileList.forEach(function (fileName) {
        var rawJsonString = readFixtures(fileName);

        describe(fileName, function(){
            var errors;
            beforeEach(function(){
                spyOn(window, 'alert');
                errors = app.openDiagram(rawJsonString);
            });


            if(endsWith(fileName, "_fail_hard.json")){

                it("should fail on loading", function(){
                    expect(errors.length).toBeTruthy()
                });

                it("should alert user", function(){
                    expect(window.alert).toHaveBeenCalled();
                })
            }else{

                it("should not alert user", function(){
                    expect(window.alert).not.toHaveBeenCalled();
                });

                it("should not fail hard on loading", function(){
                    expect(errors.length).toBeFalsy();
                });


                if(endsWith(fileName, "_pass.json")){
                    it("should load without computation/validation errors", function(){
                        app.checkValidityAndRecomputeObjective(true, true, true);
                        app.validationResults.forEach(function (result) {
                            expect(result.isValid()).toBeTruthy()
                        });
                    })
                }else if(endsWith(fileName, "_fail.json")){
                    it("should load with computation/validation errors", function(){
                        app.checkValidityAndRecomputeObjective(true, true, true);
                        var valid = true;
                        app.validationResults.forEach(function (result) {
                            valid = valid && result.isValid();
                        });
                        expect(valid).toBeFalsy()
                    })
                }
            }
        })
    });

    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }
});
