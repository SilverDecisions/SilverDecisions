describe("A SilverDecisions", function() {
    var containerId = 'container';
    var container;
    var app;

    beforeEach(function() {
        container = document.createElement("div");
        container.id = containerId;
        document.getElementsByTagName('body')[0].appendChild(container);
        app = new SilverDecisions.App(containerId);
    });

    it("should be initialized", function() {

        expect(app).toBeTruthy();
        expect(document.getElementById('silver-decisions')).toBeTruthy();

    });


});
