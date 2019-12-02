class AWSServiceNotFoundError extends Error {
  constructor(service, slug) {
    super(`${service} service with ${slug} was not found using AWS api`)
    this.name = 'AWSServiceNotFoundError'
    this.sender = 'aws-resolver-plugin'
  }
}

class AWSInvalidKeysError extends Error {
  constructor(slug, request, candidates) {
    super(`Error resolving ${slug}. Key '${request}' not found. Candidates are ${candidates}`)
    this.name = 'AWSInvalidKeysError'
    this.sender = 'aws-resolver-plugin'
  }
}

class UnhandledServiceError extends Error {
  constructor(slug) {
    super(`The service ${slug} cannot be resolved`)
    this.name = 'UnhandledServiceError'
    this.sender = 'aws-resolver-plugin'
  }
}

class AWSEmptyResultsError extends Error {
  constructor(slug) {
    super(`Could not find any result with identifier ${slug}`)
    this.name = 'AWSEmptyResultsError'
    this.sender = 'aws-resolver-plugin'
  }
}

class AWSTooManyResultsError extends Error {
  constructor(slug, instancesNumber) {
    super(`Expected exactly one instance for key ${slug}. Got ${instancesNumber}`)
    this.name = 'AWSTooManyResultsError'
    this.sender = 'aws-resolver-plugin'
  }
}

class WrongResultTypeError extends Error {
  constructor(expected, instance) {
    super(`Expected ${expected}. Got ${instance}`)
    this.name = 'WrongResultTypeError'
    this.sender = 'aws-resolver-plugin'
  }
}

class AWSWrongConfigurationError extends Error {
  constructor() {
    super(`Wrong confirguration for AWS`)
    this.name = 'AWSWrongConfigurationError'
    this.sender = 'aws-resolver-plugin'
  }
}

class AWSInvalidFormatError extends Error {
  constructor(slug) {
    super(`Invalid AWS format for ${slug}`)
    this.name = 'AWSInvalidFormatError'
    this.sender = 'aws-resolver-plugin'
  }
}

class AWSWrongResolverError extends Error {
  constructor(resolver) {
    super(`Wrong resolver chosen: ${resolver}`)
    this.name = 'AWSWrongResolverError'
    this.sender = 'aws-resolver-plugin'
  }
}

export {AWSServiceNotFoundError, AWSInvalidKeysError, UnhandledServiceError, AWSEmptyResultsError, AWSTooManyResultsError, WrongResultTypeError, AWSWrongConfigurationError, AWSInvalidFormatError, AWSWrongResolverError}
