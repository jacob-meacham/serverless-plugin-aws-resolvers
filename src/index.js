import _ from 'lodash'
import winston from 'winston'
import * as handlers from './handlers'
import {AWSInvalidKeysError, UnhandledServiceError} from './errors'

const AWS_PREFIX = 'aws'

const AWS_HANDLERS = {
  ecs: handlers.getECSValue,
  ess: handlers.getESSValue,
  kinesis: handlers.getKinesisValue,
  dynamodb: handlers.getDynamoDbValue,
  rds: handlers.getRDSValue,
  ec2: handlers.getEC2Value
}

/* eslint-disable no-useless-escape */
const patterns = {
  default: RegExp(/^(?<resolver>aws):(?<service>\w+)(?<params>(?::[\w\-\[\]\.]+)+)$/g)
}
// const DEFAULT_AWS_PATTERN = /^aws:\w+:[\w-.]+:[\w.\[\]]+$/
// const SUB_SERVICE_AWS_PATTERN = /^aws:\w+:\w+:[\w-.]+:[\w.\[\]]+$/
/* eslint-enable no-useless-escape */

/**
 * @param slug the variable to resolve
 * @param region the AWS region to use
 * @param strictMode throw errors if aws can't find value or allow overwrite
 * @returns {Promise.<String>} a promise for the resolved variable
 * @example const myResolvedVariable = await getValueFromAws('aws:kinesis:my-stream:StreamARN', 'us-east-1')
 */
async function getValueFromAws(slug, region, strictMode) {
  try {
    // The format is aws:${service}:${key}:${request} or aws:${service}:${subService}:${key}:${request}.
    // eg.: aws:kinesis:stream-name:StreamARN
    // Validate the input format
    // TODO: change that error
    if (!slug || !region || !strictMode)
      throw new Error(`One of the parameters is not defined`)

    const commonParameters = {}
    commonParameters.region = region

    let captured = null
    captured = patterns.default.exec(slug)
    patterns.default.lastIndex = 0
    // TODO: change these errors
    if (!captured || !captured.groups || !captured.input) throw new Error(`Invalid AWS format for ${slug}`)

    let {groups, input} = captured

    if ('aws' !== groups.resolver) throw new Error(`Wrong resolver chosen: ${groups.resolver}`)

    groups.params = groups.params.split(':').filter(String);
    groups.paramsLength = groups.params.length;

    if (2 > groups.paramsLength) throw new Error(`Invalid AWS format for ${slug}`)

    if (groups.service in AWS_HANDLERS) {

      let key = groups.params[0]
      let request = groups.params[1]
      // We are dealing with a subService instead of a standard service
      if (3 == groups.paramsLength) {
        key = groups.params.slice(0, 2).join(':')
        request = groups.params[2]
      }

      let description = await AWS_HANDLERS[groups.service](key, commonParameters)

      // Validate that the desired property exists
      if (!_.has(description, request)) {
        throw new AWSInvalidKeysError(slug, request, Object.keys(description))
      }

      return _.get(description, request)
    }

    throw new UnhandledServiceError(slug)
  } catch (e) {
    if (strictMode) {
      throw e
    }

    winston.debug(`Error while resolving ${slug}: ${e.message}`)
    return null
  }
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
    serverless.variables.getValueFromSource = function getValueFromSource(slug) { // eslint-disable-line no-param-reassign, max-len
      const region = serverless.service.provider.region
      const strictMode = _.get(serverless.service.custom, 'awsResolvers.strict', true)

      if (!region)  throw new Error('Cannot hydrate AWS variables without a region')

      if (slug.startsWith(`${AWS_PREFIX}:`)) return getValueFromAws(slug, region, strictMode)

      return delegate(slug)
    }
  }
}

module.exports = ServerlessAWSResolvers
