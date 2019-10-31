import _ from 'lodash'
import AWS from 'aws-sdk'
import winston from 'winston'
import url from 'url'
import HttpsProxyAgent from 'https-proxy-agent'

// Use HTTPS Proxy (Optional)
const proxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY

if (proxy) {
  AWS.config.httpOptions.agent = new HttpsProxyAgent(url.parse(proxy))
}

const AWS_PREFIX = 'aws'

/**
 * @param key the name of the ElastiCache cluster to resolve
 * @param awsParameters parameters to pass to the AWS.ElastiCache constructor
 * @returns {Promise<AWS.ElastiCache.CacheCluster>}
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ElastiCache.html#describeCacheClusters-property
 */
async function getECSValue(key, awsParameters) {
  winston.debug(`Resolving ElastiCache cluster with name ${key}`)
  const ecs = new AWS.ElastiCache({ ...awsParameters, apiVersion: '2015-02-02' })
  const result = await ecs.describeCacheClusters({ CacheClusterId: key, ShowCacheNodeInfo: true }).promise()
  if (!result || !result.CacheClusters.length) {
    throw new Error(`Could not find ElastiCache cluster with name ${key}`)
  }

  return result.CacheClusters[0]
}

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
 * @param key the name of the security group to resolve
 * @param awsParameters parameters to pass to the AWS.EC2 constructor
 * @returns {Promise<AWS.EC2.SecurityGroup>}
 * @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeSecurityGroups-property
 */
async function getEC2Value(key, awsParameters) {
  const ec2 = new AWS.EC2({...awsParameters, apiVersion: '2015-01-01'})

  const values = key.split(':')

  if (values[0] === 'vpc') {
    return getVPCValue(values[1], awsParameters)
  } else if (values[0] === 'subnet') {
    return getSubnetValue(values[1], awsParameters)
  } else if (values[0] === 'securityGroup') {
    const groupValues = values[1].split('-')
    const vpc = await getVPCValue(groupValues[0], awsParameters)
    const result = await ec2.describeSecurityGroups(
      {
        Filters: [{Name: 'group-name', Values: [groupValues[1]]},
          {Name: 'vpc-id', Values: [vpc.VpcId]}]
      }).promise()

    if (!result || !result.SecurityGroups.length) {
      throw new Error(`Could not find security group with name ${groupValues[1]} in ${vpc.VpcId}`)
    }
    return result.SecurityGroups[0]
  }
  throw new Error(`Unsupported EC2 value. ${values[0]}`)
}

/**
 * @param key the name of the VPC to resolve
 * @param awsParameters parameters to pass to the AWS.EC2 constructor
 * @returns {Promise<AWS.EC2.DescribeVpcs>}
 * @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeVpcs-property
 */
async function getVPCValue(key, awsParameters) {
  winston.debug(`Resolving vpc with name ${key}`)
  const ec2 = new AWS.EC2({ ...awsParameters, apiVersion: '2015-01-01' })
  const result = await ec2.describeVpcs(
    {Filters: [{Name: 'tag-value', Values: [key]}]}).promise()

  if (!result || !result.Vpcs.length) {
    throw new Error(`Could not find vpc with name ${key}`)
  }

  return result.Vpcs[0]
}

/**
 * @param key the name of the subnet to resolve
 * @param awsParameters parameters to pass to the AWS.EC2 constructor
 * @returns {Promise<AWS.EC2.DescribeSubnets>}
 * @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeSubnets-property
 */
async function getSubnetValue(key, awsParameters) {
  winston.debug(`Resolving subnet with name ${key}`)
  const ec2 = new AWS.EC2({ ...awsParameters, apiVersion: '2015-01-01' })
  const result = await ec2.describeSubnets(
    {Filters: [{Name: 'tag-value', Values: [key]}]}).promise()

  if (!result || !result.Subnets.length) {
    throw new Error(`Could not find subnet with name ${key}`)
  }

  return result.Subnets[0]
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
 * @param key the name of the DynamoDb table to resolve
 * @param awsParameters parameters to pass to the AWS.DynamoDB constructor
 * @returns {Promise<AWS.DynamoDB.Table>}
 * @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#describeTable-property
 */
async function getDynamoDbValue(key, awsParameters) {
  winston.debug(`Resolving DynamoDB stream with name ${key}`)
  const dynamodb = new AWS.DynamoDB({ ...awsParameters, apiVersion: '2012-08-10' })
  const result = await dynamodb.describeTable({ TableName: key }).promise()
  return result.Table
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
    throw new Error(`Could not find any databases with identifier ${key}`)
  }
  // Parse out the instances
  const instances = result.DBInstances

  if (instances.length !== 1) {
    throw new Error(`Expected exactly one DB instance for key ${key}. Got ${Object.keys(instances)}`)
  }

  return instances[0]
}

const AWS_HANDLERS = {
  ecs: getECSValue,
  ess: getESSValue,
  kinesis: getKinesisValue,
  dynamodb: getDynamoDbValue,
  rds: getRDSValue,
  ec2: getEC2Value
}

/* eslint-disable no-useless-escape */
const DEFAULT_AWS_PATTERN = /^aws:\w+:[\w-.]+:[\w.\[\]]+$/
const SUB_SERVICE_AWS_PATTERN = /^aws:\w+:\w+:[\w-.]+:[\w.\[\]]+$/
/* eslint-enable no-useless-escape */

/**
 * @param variableString the variable to resolve
 * @param region the AWS region to use
 * @param strictMode throw errors if aws can't find value or allow overwrite
 * @returns {Promise.<String>} a promise for the resolved variable
 * @example const myResolvedVariable = await getValueFromAws('aws:kinesis:my-stream:StreamARN', 'us-east-1')
 */
async function getValueFromAws(variableString, region, strictMode) {
  // The format is aws:${service}:${key}:${request} or aws:${service}:${subService}:${key}:${request}.
  // eg.: aws:kinesis:stream-name:StreamARN
  // Validate the input format
  if (!variableString.match(DEFAULT_AWS_PATTERN) && !variableString.match(SUB_SERVICE_AWS_PATTERN)) {
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
      let subKey = rest.split(`${service}:`)[1]

      let request = ''
      let key = ''
      // We are dealing with a subService instead of a standard service
      if (variableString.match(SUB_SERVICE_AWS_PATTERN)) {
        request = subKey.split(':')[2]
        key = subKey.split(':').slice(0, 2).join(':')
      } else {
        request = subKey.split(':')[1]
        key = subKey.split(':')[0]
      }

      let description
      try {
        description = await AWS_HANDLERS[service](key, commonParameters) // eslint-disable-line no-await-in-loop, max-len
      } catch (e) {
        if (strictMode) {
          throw e
        }

        winston.debug(`Error while resolving ${variableString}: ${e.message}`)
        return null
      }

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
      const strictMode = _.get(serverless.service.custom, 'awsResolvers.strict', true)
      if (!region) {
        throw new Error('Cannot hydrate AWS variables without a region')
      }
      if (variableString.startsWith(`${AWS_PREFIX}:`)) {
        return getValueFromAws(variableString, region, strictMode)
      }

      return delegate(variableString)
    }
  }
}

module.exports = ServerlessAWSResolvers
