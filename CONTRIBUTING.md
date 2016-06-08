# Contributing

## Requirements

- `docker`
- `docker-compose`
- [jet](https://codeship.com/documentation/docker/installation/)

## Installing node_modules locally

If you want to have the `node_modules` folder locally on the host system (useful for IDEs that integrate with our `eslint` for example), you can run:

```
docker build -t kit-image-deployer . && id=$(docker create kit-image-deployer) && docker cp $id:/node_modules ./node_modules && docker rm $id
```

## Running build and tests

You can use the Codeship [jet](https://codeship.com/documentation/docker/installation/) command to build and run all tests in parallel.

1. `jet steps`

Alternatively you can use `docker-compose`:

1. Run `cp environment.template.env environment.env`
1. Update `environment.env` with required information
1. Run `docker-compose up`

## Breaking Changes

If you ever need to implement breaking changes (non-backwards-compatible changes) to this service, you should increment the major tag version accordingly. To do this, simply update the `image_tag` property for the major version registry step in `codeship-steps.yml`. Other services will have to be manually updated to point to the latest major version tag to receive the newest image, during which time any configuration adjustments needed can be made.
