"use strict";

const Promise = require("bluebird");
const yaml = require("js-yaml");
const _ = require("lodash");
const path = require("path");
const GitHubApi = require("github");

class ImageDeployer {
	constructor(options) {
		this.options = _.merge({
			docker: {
				registry: undefined,
				repo: undefined
			},
			github: {
				token: undefined,
				user: undefined,
				repo: undefined
			}
		}, options);

		var github = new GitHubApi({
			version: "3.0.0"
		});
		github.authenticate({
			type: "token",
			token: this.options.github.token
		});
		this.github = {
			getContent: Promise.promisify(github.repos.getContent),
			createFile: Promise.promisify(github.repos.createFile),
			updateFile: Promise.promisify(github.repos.updateFile)
		};
	}

	deployCommitId(commitId, branch, committer, message, save) {
		var image = this.options.docker.registry + "/" + this.options.docker.repo + ":" + branch + "-" + commitId;
		return this.deployImage(image, branch, committer, message, save);
	}

	deployImage(image, branch, committer, message, save) {
		var self = this;
		return new Promise(function(resolve, reject) {
			var imageFilePath, property;
			var configRequest = {
				user: self.options.github.user,
				repo: self.options.github.repo,
				path: "kit.yaml"
			};

			self.github.getContent(configRequest)
				.then(function(configResponse) {
					var rawConfig = new Buffer(configResponse.content, configResponse.encoding).toString("ascii");
					var config = yaml.safeLoad(rawConfig);
					imageFilePath = path.join(config.images.path.replace(/^\//, ""), self.options.docker.repo, branch + ".yaml");
					property = config.images.property;

					var imageRequest = {
						user: self.options.github.user,
						repo: self.options.github.repo,
						path: imageFilePath
					};
					return self.github.getContent(imageRequest)
						.then(function(imageResponse) {
							// get
							var rawFile = new Buffer(imageResponse.content, imageResponse.encoding).toString("ascii");
							var file = yaml.safeLoad(rawFile);

							// update specified property in file
							if (!_.isObject(file)) {
								throw new Error("Only support updating yaml type files");
							}
							if (!property) {
								throw new Error("Require configuration missing: 'property'");
							}

							// only save if the image has changed
							if (file[property] != image) {
								var commitMsg = "committed " + property + ": '" + image + "' to " + imageFilePath;

								// only continue saving if commit is enabled
								if (!save) {
									return "Commit disabled, but would have " + commitMsg;
								}

								file[property] = image;
								var updatedFile = new Buffer(yaml.safeDump(file)).toString("base64");

								return self.github.updateFile({
									user: self.options.github.user,
									repo: self.options.github.repo,
									path: imageFilePath,
									message: message,
									content: updatedFile,
									committer: committer,
									sha: imageResponse.sha
								}).then(function() {
									return "Successfully " + commitMsg;
								});
							} else {
								return "No changes found";
							}
						})
						.catch(function(err) {
							if (err && err.code === 404) {
								// create file if it does not exist yet
								var newFile = {};
								newFile[property] = image;
								var createdFile = new Buffer(yaml.safeDump(newFile)).toString("base64");
								var commitMsg = "committed " + property + ": '" + image + "' to " + imageFilePath;

								// only continue saving if commit is enabled
								if (!save) {
									return "Commit disabled, but would have " + commitMsg;
								}

								return self.github.createFile({
									user: self.options.github.user,
									repo: self.options.github.repo,
									path: imageFilePath,
									message: message,
									content: createdFile,
									committer: committer
								})
								.then(function() {
									return "Successfully " + commitMsg;
								});
							} else {
								// if it's not a `404` error, then throw again
								throw err;
							}
						});
				})
				.then(resolve)
				.catch(reject);
		});
	}
}

module.exports = ImageDeployer;
