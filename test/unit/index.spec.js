var expect = require("chai").expect;

describe("KitImageDeployer", function() {
	describe("when required", function() {
		var KitImageDeployer;
		beforeEach(function() {
			KitImageDeployer = require("../../src/index");
		});
		it("should have Operation", function() {
			expect(KitImageDeployer.ImageDeployer).to.be.equal(require("../../src/lib/image-deployer"));
		});
	});
});
