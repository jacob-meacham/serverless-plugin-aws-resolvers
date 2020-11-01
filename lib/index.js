"use strict";

var _lodash = _interopRequireDefault(require("lodash"));

var _awsSdk = _interopRequireDefault(require("aws-sdk"));

var _winston = _interopRequireDefault(require("winston"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const AWS_PREFIX = 'aws';
/**
 * @param key the name of the ElastiCache cluster to resolve
 * @param awsParameters parameters to pass to the AWS.ElastiCache constructor
 * @returns {Promise<AWS.ElastiCache.CacheCluster>}
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ElastiCache.html#describeCacheClusters-property
 */

function getECSValue(_x, _x2) {
  return _getECSValue.apply(this, arguments);
}
/**
 * @param key the name of the ElasticSearch cluster to resolve
 * @param awsParameters parameters to pass to the AWS.ES constructor
 * @returns {Promise<AWS.ES.ElasticsearchDomainStatus>}
 * @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ES.html#describeElasticsearchDomain-property
 */


function _getECSValue() {
  _getECSValue = _asyncToGenerator(function* (key, awsParameters) {
    _winston.default.debug(`Resolving ElastiCache cluster with name ${key}`);

    const ecs = new _awsSdk.default.ElastiCache(_objectSpread(_objectSpread({}, awsParameters), {}, {
      apiVersion: '2015-02-02'
    }));
    const result = yield ecs.describeCacheClusters({
      CacheClusterId: key,
      ShowCacheNodeInfo: true
    }).promise();

    if (!result || !result.CacheClusters.length) {
      throw new Error(`Could not find ElastiCache cluster with name ${key}`);
    }

    return result.CacheClusters[0];
  });
  return _getECSValue.apply(this, arguments);
}

function getESSValue(_x3, _x4) {
  return _getESSValue.apply(this, arguments);
}
/**
 * @param key the name of the security group to resolve
 * @param awsParameters parameters to pass to the AWS.EC2 constructor
 * @returns {Promise<AWS.EC2.SecurityGroup>}
 * @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeSecurityGroups-property
 */


function _getESSValue() {
  _getESSValue = _asyncToGenerator(function* (key, awsParameters) {
    _winston.default.debug(`Resolving ElasticSearch cluster with name ${key}`);

    const ess = new _awsSdk.default.ES(_objectSpread(_objectSpread({}, awsParameters), {}, {
      apiVersion: '2015-01-01'
    }));
    const result = yield ess.describeElasticsearchDomain({
      DomainName: key
    }).promise();

    if (!result || !result.DomainStatus) {
      throw new Error(`Could not find ElasticSearch cluster with name ${key}`);
    }

    return result.DomainStatus;
  });
  return _getESSValue.apply(this, arguments);
}

function getEC2Value(_x5, _x6) {
  return _getEC2Value.apply(this, arguments);
}
/**
 * @param key the name of the VPC to resolve
 * @param awsParameters parameters to pass to the AWS.EC2 constructor
 * @returns {Promise<AWS.EC2.DescribeVpcs>}
 * @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeVpcs-property
 */


function _getEC2Value() {
  _getEC2Value = _asyncToGenerator(function* (key, awsParameters) {
    const ec2 = new _awsSdk.default.EC2(_objectSpread(_objectSpread({}, awsParameters), {}, {
      apiVersion: '2015-01-01'
    }));
    const values = key.split(':');

    if (values[0] === 'vpc') {
      return getVPCValue(values[1], awsParameters);
    } else if (values[0] === 'subnet') {
      return getSubnetValue(values[1], awsParameters);
    } else if (values[0] === 'securityGroup') {
      const groupValues = values[1].split('-');
      const vpc = yield getVPCValue(groupValues[0], awsParameters);
      const result = yield ec2.describeSecurityGroups({
        Filters: [{
          Name: 'group-name',
          Values: [groupValues[1]]
        }, {
          Name: 'vpc-id',
          Values: [vpc.VpcId]
        }]
      }).promise();

      if (!result || !result.SecurityGroups.length) {
        throw new Error(`Could not find security group with name ${groupValues[1]} in ${vpc.VpcId}`);
      }

      return result.SecurityGroups[0];
    }

    throw new Error(`Unsupported EC2 value. ${values[0]}`);
  });
  return _getEC2Value.apply(this, arguments);
}

function getVPCValue(_x7, _x8) {
  return _getVPCValue.apply(this, arguments);
}
/**
 * @param key the name of the subnet to resolve
 * @param awsParameters parameters to pass to the AWS.EC2 constructor
 * @returns {Promise<AWS.EC2.DescribeSubnets>}
 * @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeSubnets-property
 */


function _getVPCValue() {
  _getVPCValue = _asyncToGenerator(function* (key, awsParameters) {
    _winston.default.debug(`Resolving vpc with name ${key}`);

    const ec2 = new _awsSdk.default.EC2(_objectSpread(_objectSpread({}, awsParameters), {}, {
      apiVersion: '2015-01-01'
    }));
    const result = yield ec2.describeVpcs({
      Filters: [{
        Name: 'tag-value',
        Values: [key]
      }]
    }).promise();

    if (!result || !result.Vpcs.length) {
      throw new Error(`Could not find vpc with name ${key}`);
    }

    return result.Vpcs[0];
  });
  return _getVPCValue.apply(this, arguments);
}

function getSubnetValue(_x9, _x10) {
  return _getSubnetValue.apply(this, arguments);
}
/**
 * @param key the name of the Kinesis stream to resolve
 * @param awsParameters parameters to pass to the AWS.Kinesis constructor
 * @returns {Promise<AWS.Kinesis.StreamDescription>}
 * @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Kinesis.html#describeStream-property
 */


function _getSubnetValue() {
  _getSubnetValue = _asyncToGenerator(function* (key, awsParameters) {
    _winston.default.debug(`Resolving subnet with name ${key}`);

    const ec2 = new _awsSdk.default.EC2(_objectSpread(_objectSpread({}, awsParameters), {}, {
      apiVersion: '2015-01-01'
    }));
    const result = yield ec2.describeSubnets({
      Filters: [{
        Name: 'tag-value',
        Values: [key]
      }]
    }).promise();

    if (!result || !result.Subnets.length) {
      throw new Error(`Could not find subnet with name ${key}`);
    }

    return result.Subnets[0];
  });
  return _getSubnetValue.apply(this, arguments);
}

function getKinesisValue(_x11, _x12) {
  return _getKinesisValue.apply(this, arguments);
}
/**
 * @param key the name of the DynamoDb table to resolve
 * @param awsParameters parameters to pass to the AWS.DynamoDB constructor
 * @returns {Promise<AWS.DynamoDB.Table>}
 * @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#describeTable-property
 */


function _getKinesisValue() {
  _getKinesisValue = _asyncToGenerator(function* (key, awsParameters) {
    _winston.default.debug(`Resolving Kinesis stream with name ${key}`);

    const kinesis = new _awsSdk.default.Kinesis(_objectSpread(_objectSpread({}, awsParameters), {}, {
      apiVersion: '2013-12-02'
    }));
    const result = yield kinesis.describeStream({
      StreamName: key
    }).promise();
    return result.StreamDescription;
  });
  return _getKinesisValue.apply(this, arguments);
}

function getDynamoDbValue(_x13, _x14) {
  return _getDynamoDbValue.apply(this, arguments);
}
/**
 * @param key the name of the RDS instance to resolve
 * @param awsParameters parameters to pass to the AWS.RDS constructor
 * @returns {Promise.<AWS.RDS.DBInstance>}
 * @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDS.html#describeDBInstances-property
 */


function _getDynamoDbValue() {
  _getDynamoDbValue = _asyncToGenerator(function* (key, awsParameters) {
    _winston.default.debug(`Resolving DynamoDB stream with name ${key}`);

    const dynamodb = new _awsSdk.default.DynamoDB(_objectSpread(_objectSpread({}, awsParameters), {}, {
      apiVersion: '2012-08-10'
    }));
    const result = yield dynamodb.describeTable({
      TableName: key
    }).promise();
    return result.Table;
  });
  return _getDynamoDbValue.apply(this, arguments);
}

function getRDSValue(_x15, _x16) {
  return _getRDSValue.apply(this, arguments);
}
/**
 * @param key the concatenated {stackName_logicalResourceId} of the CloudFormation to resolve physicalResourceId
 * @param awsParameters parameters to pass to the AWS.CF constructor
 * @returns {Promise.<String>} a promise for the resolved variable
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudFormation.html#describeStackResource-property
 */


function _getRDSValue() {
  _getRDSValue = _asyncToGenerator(function* (key, awsParameters) {
    _winston.default.debug(`Resolving RDS database with name ${key}`);

    const rds = new _awsSdk.default.RDS(_objectSpread(_objectSpread({}, awsParameters), {}, {
      apiVersion: '2014-10-31'
    }));
    const result = yield rds.describeDBInstances({
      DBInstanceIdentifier: key
    }).promise();

    if (!result) {
      throw new Error(`Could not find any databases with identifier ${key}`);
    } // Parse out the instances


    const instances = result.DBInstances;

    if (instances.length !== 1) {
      throw new Error(`Expected exactly one DB instance for key ${key}. Got ${Object.keys(instances)}`);
    }

    return instances[0];
  });
  return _getRDSValue.apply(this, arguments);
}

function getCFPhysicalResourceId(_x17, _x18) {
  return _getCFPhysicalResourceId.apply(this, arguments);
}
/**
 * @param key the name of the APIGateway Api (Rest)
 * @param awsParameters parameters to pass to the AWS.ApiGateway constructor
 * @returns { Promise.<AWS.APIGateway.RestApi> }
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/APIGateway.html#getRestApis-property
 */


function _getCFPhysicalResourceId() {
  _getCFPhysicalResourceId = _asyncToGenerator(function* (key, awsParameters) {
    _winston.default.debug(`Resolving a CloudFormation stack's PhysicalResourceId by the concatenated {stackName_logicalResourceId} ${key}`);

    const cf = new _awsSdk.default.CloudFormation(_objectSpread(_objectSpread({}, awsParameters), {}, {
      apiVersion: '2014-10-31'
    }));
    const values = key.split('_');
    let stackName = '';
    let logicalResourceId = '';

    if (values.length === 2) {
      stackName = values[0];
      logicalResourceId = values[1];
    } else {
      throw new Error(`Invalid format for {CloudFormationStackName}_{PhysicalResourceId}, given: ${key}`);
    }

    const result = yield cf.describeStackResource({
      LogicalResourceId: logicalResourceId,
      StackName: stackName
    }).promise();

    if (!result) {
      throw new Error(`Could not find in CloudFormationStack: ${stackName} any PhysicalResourceId associated with LogicalResourceId: ${logicalResourceId}`);
    }

    return result.StackResourceDetail;
  });
  return _getCFPhysicalResourceId.apply(this, arguments);
}

function getAPIGatewayValue(_x19, _x20) {
  return _getAPIGatewayValue.apply(this, arguments);
}
/**
 * @param key the name of the APIGatewayV2 Api (Websocket / HTTP)
 * @param awsParameters parameters to pass to the AWS.ApiGatewayV2 constructor
 * @returns { Promise.<AWS.ApiGatewayV2.Api> }
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ApiGatewayV2.html#getApis-property
 */


function _getAPIGatewayValue() {
  _getAPIGatewayValue = _asyncToGenerator(function* (key, awsParameters) {
    _winston.default.debug(`Resolving APIGateway Api with name ${key}`);

    const apigateway = new _awsSdk.default.APIGateway(_objectSpread(_objectSpread({}, awsParameters), {}, {
      apiVersion: '2015-07-09'
    }));
    const apis = yield apigateway.getRestApis({}).promise();
    return filterAPIGatewayApi(apis.items, 'name', key);
  });
  return _getAPIGatewayValue.apply(this, arguments);
}

function getAPIGatewayV2Value(_x21, _x22) {
  return _getAPIGatewayV2Value.apply(this, arguments);
}
/**
 * @param apiItems array with APIGateway or APIGatewayV2 objects
 * @param nameProperty name of the property to filter on (with key)
 * @param key the name of the APIGateway(V2) Api
 * @returns { Promise.<AWS.ApiGatewayV2.Api> / Promise.<AWS.APIGateway.RestApi> }
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/APIGateway.html#getRestApis-property
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ApiGatewayV2.html#getApis-property
 */


function _getAPIGatewayV2Value() {
  _getAPIGatewayV2Value = _asyncToGenerator(function* (key, awsParameters) {
    _winston.default.debug(`Resolving ApiGatewayV2 Api with name ${key}`);

    const apigateway = new _awsSdk.default.ApiGatewayV2(_objectSpread(_objectSpread({}, awsParameters), {}, {
      apiVersion: '2018-11-29'
    }));
    const apis = yield apigateway.getApis({}).promise();
    return filterAPIGatewayApi(apis.Items, 'Name', key);
  });
  return _getAPIGatewayV2Value.apply(this, arguments);
}

function filterAPIGatewayApi(_x23, _x24, _x25) {
  return _filterAPIGatewayApi.apply(this, arguments);
}

function _filterAPIGatewayApi() {
  _filterAPIGatewayApi = _asyncToGenerator(function* (apiItems, nameProperty, key) {
    if (apiItems.length === 0) {
      throw new Error('Could not find any Apis');
    }

    const matchingApis = apiItems.filter(api => api[nameProperty] === key);

    if (matchingApis.length !== 1) {
      throw new Error(`Could not find any Api with name ${key}, found:
      ${JSON.stringify(apiItems.map(item => item[nameProperty]))}`);
    }

    return matchingApis[0];
  });
  return _filterAPIGatewayApi.apply(this, arguments);
}

const AWS_HANDLERS = {
  ecs: getECSValue,
  ess: getESSValue,
  kinesis: getKinesisValue,
  dynamodb: getDynamoDbValue,
  rds: getRDSValue,
  ec2: getEC2Value,
  cf: getCFPhysicalResourceId,
  apigateway: getAPIGatewayValue,
  apigatewayv2: getAPIGatewayV2Value
};
/* eslint-disable no-useless-escape */

const DEFAULT_AWS_PATTERN = /^aws:\w+:[\w-.]+:[\w.\[\]]+$/;
const SUB_SERVICE_AWS_PATTERN = /^aws:\w+:\w+:[\w-.]+:[\w.\[\]]+$/;
/* eslint-enable no-useless-escape */

/**
 * @param variableString the variable to resolve
 * @param region the AWS region to use
 * @param strictMode throw errors if aws can't find value or allow overwrite
 * @returns {Promise.<String>} a promise for the resolved variable
 * @example const myResolvedVariable = await getValueFromAws('aws:kinesis:my-stream:StreamARN', 'us-east-1')
 */

function getValueFromAws(_x26, _x27, _x28) {
  return _getValueFromAws.apply(this, arguments);
}
/**
 * A plugin for the serverless framework that allows resolution of deployed AWS services into variable names
 */


function _getValueFromAws() {
  _getValueFromAws = _asyncToGenerator(function* (variableString, region, strictMode) {
    // The format is aws:${service}:${key}:${request} or aws:${service}:${subService}:${key}:${request}.
    // eg.: aws:kinesis:stream-name:StreamARN
    // Validate the input format
    if (!variableString.match(DEFAULT_AWS_PATTERN) && !variableString.match(SUB_SERVICE_AWS_PATTERN)) {
      throw new Error(`Invalid AWS format for variable ${variableString}`);
    }

    const rest = variableString.split(`${AWS_PREFIX}:`)[1];

    for (const service of Object.keys(AWS_HANDLERS)) {
      if (rest.startsWith(`${service}:`)) {
        const commonParameters = {};

        if (region) {
          commonParameters.region = region;
        } // Parse out the key and request


        const subKey = rest.split(`${service}:`)[1];
        let request = '';
        let key = ''; // We are dealing with a subService instead of a standard service

        if (variableString.match(SUB_SERVICE_AWS_PATTERN)) {
          request = subKey.split(':')[2];
          key = subKey.split(':').slice(0, 2).join(':');
        } else {
          request = subKey.split(':')[1];
          key = subKey.split(':')[0];
        }

        let description;

        try {
          description = yield AWS_HANDLERS[service](key, commonParameters); // eslint-disable-line no-await-in-loop, max-len
        } catch (e) {
          if (strictMode) {
            throw e;
          }

          _winston.default.debug(`Error while resolving ${variableString}: ${e.message}`);

          return null;
        } // Validate that the desired property exists


        if (!_lodash.default.has(description, request)) {
          throw new Error(`Error resolving ${variableString}. Key '${request}' not found. Candidates are ${Object.keys(description)}`);
        }

        return _lodash.default.get(description, request);
      }
    }

    throw new TypeError(`Cannot parse AWS type from ${rest}`);
  });
  return _getValueFromAws.apply(this, arguments);
}

class ServerlessAWSResolvers {
  constructor(serverless, options) {
    this.provider = 'aws';
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
    };
    this.hooks = {
      'resolveAwsKey:run': () => getValueFromAws(options.key, serverless.service.provider.region).then(JSON.stringify).then(_lodash.default.bind(serverless.cli.log, serverless.cli))
    };

    const delegate = _lodash.default.bind(serverless.variables.getValueFromSource, serverless.variables);

    serverless.variables.getValueFromSource = function getValueFromSource(variableString) {
      // eslint-disable-line no-param-reassign, max-len
      const region = serverless.service.provider.region;

      const strictMode = _lodash.default.get(serverless.service.custom, 'awsResolvers.strict', true);

      if (!region) {
        throw new Error('Cannot hydrate AWS variables without a region');
      }

      if (variableString.startsWith(`${AWS_PREFIX}:`)) {
        return getValueFromAws(variableString, region, strictMode);
      }

      return delegate(variableString);
    };
  }

}

module.exports = ServerlessAWSResolvers;