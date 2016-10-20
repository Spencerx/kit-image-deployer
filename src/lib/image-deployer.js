"use strict";

const Promise = require("bluebird");
const yaml = require("js-yaml");
const _ = require("lodash");
const path = require("path");
const GitHubApi = require("github");

class ImageDeployer {
	constructor(options) {
		this.options = _.merge({
			retries: 10,
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

	getImageFile(property, imageFilePath, branch) {
		const self = this;
		const imageRequest = {
			user: self.options.github.user,
			repo: self.options.github.repo,
			path: imageFilePath
		};

		return self.github
			.getContent(imageRequest)
			.then((imageResponse) => {
				// get
				const rawFile = new Buffer(imageResponse.content, imageResponse.encoding).toString("ascii");
				const file = yaml.safeLoad(rawFile);

				// update specified property in file
				if (!_.isObject(file)) {
					throw new Error("Only support updating yaml type files");
				}
				if (!property) {
					throw new Error("Require configuration missing: 'property'");
				}
				return {
					file: file,
					sha: imageResponse.sha
				}
			})
	}

	attemptCommit(config, image, branch, committer, message, save) {
		return new Promise((resolve, reject) => {
			const self = this;
			const imageFilePath = path.join(config.images.path.replace(/^\//, ""), self.options.docker.repo, branch + ".yaml");
			const property = config.images.property;
			var tries = 0;
			function attempt(lastError) {
				tries++;
				if (tries > self.options.retries) {
					return reject(lastError);
				}

				self
					.getImageFile(property, imageFilePath, branch)
					.then((imageFile) => {
						// only save if the image has changed
						if (imageFile.file[property] !== image) {
							const commitMsg = "committed " + property + ": '" + image + "' to " + imageFilePath;

							imageFile.file[property] = image;
							const updatedFile = new Buffer(yaml.safeDump(imageFile.file)).toString("base64");

							// only continue saving if commit is enabled
							if (!save) {
								return "Commit disabled, but would have " + commitMsg;
							}

							self.github
								.updateFile({
									user: self.options.github.user,
									repo: self.options.github.repo,
									path: imageFilePath,
									message: message,
									content: updatedFile,
									committer: committer,
									sha: imageFile.sha
								})
								.then(function() {
									resolve("Successfully " + commitMsg);
								})
								.catch((err) => {
									attempt(err);
								});
						} else {
							resolve("No changes found for " + property + ": '" + image + "' to " + imageFilePath);
						}
					})
					.catch((err) => {
						if (err && err.code && err.code === 404) {
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
							.then(() => {
								resolve("Successfully " + commitMsg);
							})
							.catch(() => {
								// try again
								attempt(err);
							});
						} else {
							// try again
							attempt(err);
						}
					});
			}

			// start trying!
			attempt();
		});
	}

	deployImage(image, branch, committer, message, save) {
		const self = this;
		return new Promise(function(resolve, reject) {
			const configRequest = {
				user: self.options.github.user,
				repo: self.options.github.repo,
				path: "kit.yaml"
			};

			self.github.getContent(configRequest)
				.then(function(configResponse) {
					const rawConfig = new Buffer(configResponse.content, configResponse.encoding).toString("ascii");
					const config = yaml.safeLoad(rawConfig);
					return self.attemptCommit(config, image, branch, committer, message, save);
				})
				.then(resolve)
				.catch(reject);
		});
	}
}

module.exports = ImageDeployer;
