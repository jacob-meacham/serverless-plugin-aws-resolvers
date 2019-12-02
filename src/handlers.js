import AWS from 'aws-sdk'
import winston from 'winston'
import {AWSServiceNotFoundError, AWSEmptyResultsError, AWSTooManyResultsError, WrongResultTypeError, UnhandledServiceError} from './errors'

/**
 * @param key the name of the ElastiCache cluster to resolve
 * @param awsParameters parameters to pass to the AWS.ElastiCache constructor
 * @returns {Promise<AWS.ElastiCache.CacheCluster>}
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ElastiCache.html#describeCacheClusters-property
 */
async function getECSValue(key, awsParameters) {
  winston.debug(`Resolving ElastiCache cluster with name ${key}`)
  const ecs = new AWS.ElastiCache({ ...awsParameters, apiVersion: '2015-02-02' })

  try {
    let result = await ecs.describeCacheClusters({ CacheClusterId: key, ShowCacheNodeInfo: true }).promise()

    if (!(result instanceof Object)) {
      throw new WrongResultTypeError('Object', typeof result)
    }

    if (!result || !result.CacheClusters || !result.CacheClusters.length) {
      throw new AWSEmptyResultsError(key)
    }

    // Parse out the Clusters
    const instances = result.CacheClusters

    if (instances.length > 1) {
      throw new AWSTooManyResultsError(key, Object.keys(instances).length)
    }

    return instances[0]
  } catch (error) {
    if (error.sender === 'aws-resolver-plugin') {
      throw error
    }
    winston.debug(error.message)
    throw new AWSServiceNotFoundError('ECS', key)
  }
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

  try {
    let result = await ess.describeElasticsearchDomain({ DomainName: key }).promise()

    if (!(result instanceof Object)) {
      throw new WrongResultTypeError('Object', typeof result)
    }

    if (!result || !result.DomainStatus || !Object.keys(result.DomainStatus).length) {
      throw new AWSEmptyResultsError(key)
    }

    return result.DomainStatus
  } catch (error) {
    if (error.sender === 'aws-resolver-plugin') {
      throw error
    }
    winston.debug(error.message)
    throw new AWSServiceNotFoundError('ESS', key)
  }
}

/**
 * @param key the name of the security group to resolve
 * @param awsParameters parameters to pass to the AWS.EC2 constructor
 * @returns {Promise<AWS.EC2.SecurityGroup>}
 * @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeSecurityGroups-property
 */
async function getEC2Value(key, awsParameters) {
  const ec2 = new AWS.EC2({...awsParameters, apiVersion: '2015-01-01'})

  const keys = key.split(':')

  switch (keys[0]) {
    case 'vpc':
      return getVPCValue(keys[1], awsParameters)

    case 'subnet':
      return getSubnetValue(keys[1], awsParameters)

    case 'securityGroup':
      const groupValues = keys[1].split('-')
      const vpc = await getVPCValue(groupValues[0], awsParameters)

      try {
        let result = await ec2.describeSecurityGroups(
          {
            Filters: [{Name: 'group-name', Values: [groupValues[1]]},
              {Name: 'vpc-id', Values: [vpc.VpcId]}]
          }).promise()

        if (!(result instanceof Object)) {
          throw new WrongResultTypeError('Object', typeof result)
        }

        if (!result || !result.SecurityGroups || !result.SecurityGroups.length) {
          throw new AWSEmptyResultsError(key)
        }

        // Parse out the instances
        const instances = result.SecurityGroups

        if (instances.length > 1) {
          throw new AWSTooManyResultsError(key, Object.keys(instances).length)
        }

        return instances[0]
      } catch (error) {
        if (error.sender === 'aws-resolver-plugin') {
          throw error
        }
        winston.debug(error.message)
        throw new AWSServiceNotFoundError('Security Group', key)
      }

    default:
      throw new UnhandledServiceError(keys[0])
  }
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

  try {
    let result = await ec2.describeVpcs(
      {Filters: [{Name: 'tag-value', Values: [key]}]}).promise()

    if (!(result instanceof Object)) {
      throw new WrongResultTypeError('Object', typeof result)
    }

    if (!result || !result.Vpcs || !result.Vpcs.length) {
      throw new AWSEmptyResultsError(key)
    }

    // Parse out the instances
    const instances = result.Vpcs

    if (instances.length > 1) {
      throw new AWSTooManyResultsError(key, Object.keys(instances).length)
    }

    return instances[0]
  } catch (error) {
    if (error.sender === 'aws-resolver-plugin') {
      throw error
    }
    winston.debug(error.message)
    throw new AWSServiceNotFoundError('VPC', key)
  }
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

  try {
    let result = await ec2.describeSubnets(
      {Filters: [{Name: 'tag-value', Values: [key]}]}).promise()

    if (!(result instanceof Object)) {
      throw new WrongResultTypeError('Object', typeof result)
    }

    if (!result || !result.Subnets || !result.Subnets.length) {
      throw new AWSEmptyResultsError(key)
    }

    // Parse out the instances
    const instances = result.Subnets

    if (instances.length > 1) {
      throw new AWSTooManyResultsError(key, Object.keys(instances).length)
    }

    return instances[0]
  } catch (error) {
    if (error.sender === 'aws-resolver-plugin') {
      throw error
    }
    winston.debug(error.message)
    throw new AWSServiceNotFoundError('Subnet', key)
  }
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
  try {
    let result = await kinesis.describeStream({ StreamName: key }).promise()

    if (!(result instanceof Object)) {
      throw new WrongResultTypeError('Object', typeof result)
    }

    if (!result || !result.StreamDescription || !Object.keys(result.StreamDescription).length) {
      throw new AWSEmptyResultsError(key)
    }

    return result.StreamDescription
  } catch (error) {
    if (error.sender === 'aws-resolver-plugin') {
      throw error
    }
    winston.debug(error.message)
    throw new AWSServiceNotFoundError('Kinesis', key)
  }
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

  try {
    let result = await dynamodb.describeTable({ TableName: key }).promise()

    if (!(result instanceof Object)) {
      throw new WrongResultTypeError('Object', typeof result)
    }

    if (!result || !result.Table || !Object.keys(result.Table).length) {
      throw new AWSEmptyResultsError(key)
    }

    return result.Table
  } catch (error) {
    if (error.sender === 'aws-resolver-plugin') {
      throw error
    }
    winston.debug(error.message)
    throw new AWSServiceNotFoundError('Dynamo Db', key)
  }
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

  try {
    let result = await rds.describeDBInstances({ DBInstanceIdentifier: key }).promise()

    if (!(result instanceof Object)) {
      throw new WrongResultTypeError('Object', typeof result)
    }

    if (!result || !result.DBInstances || !result.DBInstances.length) {
      throw new AWSEmptyResultsError(key)
    }

    // Parse out the instances
    const instances = result.DBInstances

    if (instances.length > 1) {
      throw new AWSTooManyResultsError(key, Object.keys(instances).length)
    }

    return instances[0]
  } catch (error) {
    if (error.sender === 'aws-resolver-plugin') {
      throw error
    }
    winston.debug(error.message)
    throw new AWSServiceNotFoundError('RDS', key)
  }
}

export {getECSValue, getESSValue, getKinesisValue, getDynamoDbValue, getRDSValue, getEC2Value}
