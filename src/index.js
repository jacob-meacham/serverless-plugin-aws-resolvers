import _ from 'lodash'
import AWS from 'aws-sdk'
import deasyncPromise from 'deasync-promise'
import winston from 'winston'

const AWS_PREFIX = 'aws'

/**
 * @param key the name of the ElasticSearch cluster to resolve
 * @param awsParameters parameters to pass to the AWS.ES constructor
 * @returns {Promise<AWS.ES.ElasticsearchDomainStatus>}
 * @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ES.html#describeElasticsearchDomain-property
 */
async function getESSValue(key, awsParameters) {
  winston.debug(`Resolving ElasticSearch cluster with name ${key}`)
  const ess = new AWS.ES({ ...awsParameters, apiVersion: '2015-01-01' })
  const result = await ess.describeElasticsearchDomain({ DomainName: key }).promise()
  if (!result || !result.DomainStatus) {
    throw new Error(`Could not find ElasticSearch cluster with name ${key}`)
  }

  return result.DomainStatus
}

/**
 * @param key the name of the Kinesis stream to resolve
 * @param awsParameters parameters to pass to the AWS.Kinesis constructor
 * @returns {Promise<AWS.Kinesis.StreamDescription>}
 * @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Kinesis.html#describeStream-property
 */
async function getKinesisValue(key, awsParameters) {
  winston.debug(`Resolving Kinesis stream with name ${key}`)
  const kinesis = new AWS.Kinesis({ ...awsParameters, apiVersion: '2013-12-02' })
  const result = await kinesis.describeStream({ StreamName: key }).promise()
  return result.StreamDescription
}

/**
 * @param key the name of the RDS instance to resolve
 * @param awsParameters parameters to pass to the AWS.RDS constructor
 * @returns {Promise.<AWS.RDS.DBInstance>}
 * @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDS.html#describeDBInstances-property
 */
async function getRDSValue(key, awsParameters) {
  winston.debug(`Resolving RDS database with name ${key}`)
  const rds = new AWS.RDS({ ...awsParameters, apiVersion: '2014-10-31' })
  const result = await rds.describeDBInstances({ DBInstanceIdentifier: key }).promise()
  if (!result) {
    throw new Error(`Could Not find any databases with identifier ${key}`)
  }
  // Parse out the instances
  const instances = result.DBInstances

  if (instances.length !== 1) {
    throw new Error(`Expected exactly one DB instance for key ${key}. Got ${Object.keys(instances)}`)
  }

  return instances[0]
}

const AWS_HANDLERS = {
  ess: getESSValue,
  kinesis: getKinesisValue,
  rds: getRDSValue
}

const AWS_PATTERN = /^aws:\w+:[\w-]+:\w+$/

/**
 * @param variableString the variable to resolve
 * @param region the AWS region to use
 * @returns {Promise.<String>} a promise for the resolved variable
 * @example const myResolvedVariable = await getValueFromAws('aws:kinesis:my-stream:StreamARN', 'us-east-1')
 */
async function getValueFromAws(variableString, region) {
  // The format is aws:${service}:${key}:${request}. eg.: aws:kinesis:stream-name:StreamARN
  // Validate the input format
  if (!variableString.match(AWS_PATTERN)) {
    throw new Error(`Invalid AWS format for variable ${variableString}`)
  }

  const rest = variableString.split(`${AWS_PREFIX}:`)[1]
  for (const service of Object.keys(AWS_HANDLERS)) {
    if (rest.startsWith(`${service}:`)) {
      const commonParameters = {}
      if (region) {
        commonParameters.region = region
      }

      // Parse out the key and request
      const [key, request] = rest.split(`${service}:`)[1].split(':')
      const description = await AWS_HANDLERS[service](key, commonParameters) // eslint-disable-line no-await-in-loop, max-len
      // Validate that the desired property exists
      if (!_.has(description, request)) {
        throw new Error(`Error resolving ${variableString}. Key '${request}' not found. Candidates are ${Object.keys(description)}`)
      }

      return _.get(description, request)
    }
  }

  throw new TypeError(`Cannot parse AWS type from ${rest}`)
}

/**
 * A plugin for the serverless framework that allows resolution of deployed AWS services into variable names
 */
class ServerlessAWSResolvers {
  constructor(serverless, options) {
    this.provider = 'aws'

    this.commands = {
      resolveAwsKey: {
        usage: `Resolves an AWS key (Supported prefixes: ${Object.keys(AWS_HANDLERS)})`,
        lifecycleEvents: ['run'],
        options: {
          key: {
            usage: 'The key to resolve',
            shortcut: 'k'
          }
        }
      }
    }

    this.hooks = {
      'resolveAwsKey:run': () => getValueFromAws(options.key, serverless.service.provider.region)
        .then(JSON.stringify)
        .then(_.bind(serverless.cli.log, serverless.cli))
    }

    const delegate = _.bind(serverless.variables.getValueFromSource, serverless.variables)
    serverless.variables.getValueFromSource = function getValueFromSource(variableString) { // eslint-disable-line no-param-reassign, max-len
      const region = serverless.service.provider.region
      if (!region) {
        throw new Error('Cannot hydrate AWS variables without a region')
      }
      if (variableString.startsWith(`${AWS_PREFIX}:`)) {
        return deasyncPromise(getValueFromAws(variableString, region))
      }

      return delegate(variableString)
    }
  }
}

module.exports = ServerlessAWSResolvers
