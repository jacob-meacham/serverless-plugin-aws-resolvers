import _ from 'lodash'
import AWS from 'aws-sdk'
import deasyncPromise from 'deasync-promise'
import winston from 'winston'

const AWS_PREFIX = 'aws'

async function getESSValue() {
  throw new Error('ESS variables not yet supported')
}

async function getKinesisValue(key, commonParameters) {
  winston.debug(`Resolving Kinesis stream with name ${key}`)
  // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Kinesis.html#describeStream-property
  const kinesis = new AWS.Kinesis({ ...commonParameters, apiVersion: '2013-12-02' })
  const result = await kinesis.describeStream({ StreamName: key }).promise()
  return result.StreamDescription.StreamARN
}

const AWS_HANDLERS = {
  ess: getESSValue,
  kinesis: getKinesisValue
}


async function getValueFromAws(variableString, region) {
  const rest = variableString.split(`${AWS_PREFIX}:`)[1]
  for (const key of Object.keys(AWS_HANDLERS)) {
    if (rest.startsWith(`${key}:`)) {
      const commonParameters = {}
      if (region) {
        commonParameters.region = region
      }
      return AWS_HANDLERS[key](rest.split(`${key}:`)[1], commonParameters)
    }
  }

  throw new TypeError(`Cannot parse AWS type from ${rest}`)
}

class ServerlessAWSResolvers {
  constructor(serverless) {
    this.provider = 'aws'

    this.commands = {}
    this.hooks = {}

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
