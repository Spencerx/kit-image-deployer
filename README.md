<p align="center">
  <a href="http://gulpjs.com">
    <img src="https://github.com/InVisionApp/kit-image-deployer/raw/master/media/kit-logo-horz-sm.png">
  </a>
</p>

# kit-image-deployer
[ ![Codeship Status for InVisionApp/kit-image-deployer](https://codeship.com/projects/37301840-0ff1-0134-c5dd-5e067c09569b/status?branch=master)](https://codeship.com/projects/156829)
[![Docker Repository on Quay](https://quay.io/repository/invision/kit-image-deployer/status "Docker Repository on Quay")](https://quay.io/repository/invision/kit-image-deployer)
[![npm version](https://badge.fury.io/js/kit-image-deployer.svg)](https://badge.fury.io/js/kit-image-deployer)
[![Dependency Status](https://david-dm.org/InVisionApp/kit-image-deployer.svg)](https://david-dm.org/InVisionApp/kit-image-deployer)
[![devDependency Status](https://david-dm.org/InVisionApp/kit-image-deployer/dev-status.svg)](https://david-dm.org/InVisionApp/kit-image-deployer#info=devDependencies)

A service that can be used to update given yaml files within a git repository with a new docker image path. This can be used in colaboration with `kit-deploymentizer` and `kit-deployer` to automatically update the images used for a service across multiple clusters.

## Use as Docker Image

```
docker run quay.io/invision/kit-image-deployer --help
```

We recommend using `kit` components with [Codeship's Docker Infrastructure](https://codeship.com/documentation/docker/), however you are free to run this tool however way you wish. Anything that has Docker can run this image.

## Using as CLI

You can run the `./src/image-deployer --help` to see how it works.

Note this method requires node and was tested on version `5.5.0`.

## Using as npm module

Use npm to install `kit-image-deployer`:

```
$ npm install kit-image-deployer --save
```

Then require it and use it like so:

```js
var ImageDeployer = require("kit-image-deployer").ImageDeployer;
var imageDeployer = new ImageDeployer({
	docker: {
		registry: "my-registry.com",
		repo: "example/my-service"
	},
	github: {
		token: "my-github-token-here"
		user: "chesleybrown",
		repo: "my-kube-repo"
	}
});

// Deploy by commit ID
imageDeployer.deployCommitId(
	"70c30b1b3a1fce1e6826700c31830f47521292ad",
	branch,
	{
		name: committerName,
		email: committerEmail
	},
	commitMessage,
	save)
	.then(console.log)
	.catch(console.error);

// OR deploy a full image name
imageDeployer.deployImage(
	"node:5.5.0",
	branch,
	{
		name: committerName,
		email: committerEmail
	},
	commitMessage,
	save)
	.then(console.log)
	.catch(console.error);
```

## Configuration
The repository you are writing to should have a `kit.yaml` configuration file.

```yaml
images:
  path: images
  property: image
```

- `images.path` is for specifying the directory path to where all your image yaml files will be stored
- `images.property` is the yaml property name within the given image files that will be updated with the image path

## Expected environment variables
The following environment variables are used by this service.

| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `GITHUB_AUTH_TOKEN` | Your github token to access the repo  | yes | *empty* |
| `GITHUB_USER` | The github user that the repo belongs to | yes | *empty* |
| `GITHUB_REPO` | The github repo name | yes | *empty* |
| `DOCKER_REGISTRY` | The url for the docker registry | yes | *empty* |
| `DOCKER_REPO` | The repo to use within the docker registry | yes | *empty* |
| `CI_COMMITTER_NAME` | The name of the person who committed the change | yes | *empty* |
| `CI_COMMITTER_EMAIL` | The email of the person who committed the change | yes | *empty* |
| `CI_COMMITTER_MESSAGE` | The commit message | yes | *empty* |
| `CI_BRANCH` | The name of the branch | yes | *empty* |
| `CI_COMMIT_ID` | The commit hash or ID (must provide this or `IMAGE`) | no | *empty* |
| `IMAGE` | The full path and tag to the docker image (must provide this or `CI_COMMIT_ID`) | no | *empty* |

## Contributing

See the [Contributing guide](/CONTRIBUTING.md) for steps on how to contribute to this project.

## Todo:

- [ ] Handle automatic retries if github request fails because of sha difference
