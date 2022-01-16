/**
 * Created by msills on 4/12/17.
 */

import AWS from 'aws-sdk-mock'
import assert from 'assert'
import { expect } from 'chai'
import Serverless from 'serverless'
import ServerlessAWSResolvers from '../src'

describe('ServerlessAWSResolvers', function() {
  const DEFAULT_VALUE = 'MY_VARIABLE_NAME'

  const CONFIGS = {
    KINESIS: { scope: 'kinesis', service: 'Kinesis', method: 'describeStream', topLevel: 'StreamDescription' },
    DYNAMODB: { scope: 'dynamodb', service: 'DynamoDB', method: 'describeTable', topLevel: 'Table' },
    ECS: {
      scope: 'ecs',
      service: 'ElastiCache',
      method: 'describeCacheClusters',
      topLevel: 'CacheClusters',
      testKey: 'testKey',
      testValue: 'test-value',
      serviceValue: [{ testKey: 'test-value' }]
    },
    ESS: { scope: 'ess', service: 'ES', method: 'describeElasticsearchDomain', topLevel: 'DomainStatus' },
    RDS: {
      scope: 'rds',
      service: 'RDS',
      method: 'describeDBInstances',
      topLevel: 'DBInstances',
      testKey: 'testKey',
      testValue: 'test-value',
      serviceValue: [{ testKey: 'test-value' }]
    },
    RDSCHILDVAL: {
      scope: 'rds',
      service: 'RDS',
      method: 'describeDBInstances',
      topLevel: 'DBInstances',
      testKey: 'testKey.testChild',
      testValue: 'test-value',
      serviceValue: [{ testKey: { testChild: 'test-value' } }]
    },
    RDSAURORA: {
      scope: 'rdsaurora',
      service: 'RDS',
      method: 'describeDBClusters',
      topLevel: 'DBClusters',
      testKey: 'testKey.testChild',
      testValue: 'test-value',
      serviceValue: [{ testKey: { testChild: 'test-value' } }]
    },
    EC2SecurityGroup: {
      scope: 'ec2',
      service: 'EC2',
      method: 'describeSecurityGroups',
      topLevel: 'SecurityGroups',
      subService: 'securityGroup',
      testKey: 'testKey',
      testValue: 'test-value',
      serviceValue: [{ testKey: 'test-value' }]
    },
    EC2VPC: {
      scope: 'ec2',
      service: 'EC2',
      method: 'describeVpcs',
      topLevel: 'Vpcs',
      subService: 'vpc',
      testKey: 'testKey',
      testValue: 'test-value',
      serviceValue: [{ testKey: 'test-value', VpcId: 'test-value' }]
    },
    EC2Subnet: {
      scope: 'ec2',
      service: 'EC2',
      method: 'describeSubnets',
      topLevel: 'Subnets',
      subService: 'subnet',
      testKey: 'testKey',
      testValue: 'test-value',
      serviceValue: [{ testKey: 'test-value' }]
    },
    CLOUDFORMATION: {
      scope: 'cf',
      service: 'CloudFormation',
      method: 'describeStackResource',
      topLevel: 'StackResourceDetail',
      testKey: 'testKey',
      testValue: 'test-value'
    },
    APIGATEWAY: {
      scope: 'apigateway',
      service: 'APIGateway',
      method: 'getRestApis',
      topLevel: 'items',
      testKey: 'testKey',
      testValue: 'test-value',
      serviceValue: [{ name: 'test-key', testKey: 'test-value' }]
    },
    APIGATEWAYV2: {
      scope: 'apigatewayv2',
      service: 'ApiGatewayV2',
      method: 'getApis',
      topLevel: 'Items',
      testKey: 'testKey',
      testValue: 'test-value',
      serviceValue: [{ Name: 'test-key', testKey: 'test-value' }]
    }
  }

  afterEach(function() {
    AWS.restore()
  })

  async function createFakeServerless() {
    const sls = new Serverless()
    sls.service.provider.region = 'us-east-2'

    // Attach the plugin
    sls.pluginManager.addPlugin(ServerlessAWSResolvers)
    await sls.init()
    return sls
  }

  async function testResolve({ scope, service, method, topLevel, subService, testKey, testValue, serviceValue }) {
    testKey = testKey || 'TEST_KEY'
    testValue = testValue || 'TEST_VALUE'
    if (!serviceValue) {
      serviceValue = {}
      serviceValue[testKey] = testValue
    }

    const serverless = await createFakeServerless()

    AWS.mock(service, method, (params, callback) => {
      const result = {}
      result[topLevel] = serviceValue
      callback(null, result)
    })

    if (subService) {
      serverless.service.custom.myVariable = `\${aws:${scope}:${subService}:test-key:${testKey}}`
    } else if (service === 'CloudFormation') {
      serverless.service.custom.myVariable = `\${aws:${scope}:test-key1_test-key2:${testKey}}`
    } else {
      serverless.service.custom.myVariable = `\${aws:${scope}:test-key:${testKey}}`
    }

    await serverless.variables.populateService()
    assert.equal(serverless.service.custom.myVariable, testValue)
  }

  async function testNotFound({ scope, service, method }) {
    const serverless = await createFakeServerless()

    AWS.mock(service, method, (params, callback) => {
      callback(new Error('Not found'))
    })

    serverless.service.custom.myVariable = `\${aws:${scope}:TEST_KEY}`
    expect(serverless.variables.populateService).to.throw(Error)
  }

  async function testResolveStrictFallback({ scope, service, method, subService, testKey }) {
    const serverless = await createFakeServerless()

    serverless.service.custom.awsResolvers = {
      strict: true
    }
    if (subService) {
      serverless.service.custom.myVariable = `\${aws:${scope}:${subService}:test-key:${testKey}, 'test'}`
    } else if (service === 'CloudFormation') {
      serverless.service.custom.myVariable = `\${aws:${scope}:test-key1_test-key2:${testKey}, 'test'}`
    } else {
      serverless.service.custom.myVariable = `\${aws:${scope}:test-key:${testKey}, 'test'}`
    }

    AWS.mock(service, method, (params, callback) => {
      callback(new Error('Not found'))
    })

    expect(serverless.variables.populateService).to.throw(Error)
  }

  async function testResolveFallback({ scope, service, method, subService, testKey }) {
    const serverless = await createFakeServerless()

    AWS.mock(service, method, (params, callback) => {
      callback(new Error('Not found'))
    })

    serverless.service.custom.awsResolvers = {
      strict: false
    }
    if (subService) {
      serverless.service.custom.myVariable = `\${aws:${scope}:${subService}:test-key:not-set, 'test'}`
    } else if (service === 'CloudFormation') {
      serverless.service.custom.myVariable = `\${aws:${scope}:test-key1_test-key2:not-set, 'test'}`
    } else {
      serverless.service.custom.myVariable = `\${aws:${scope}:test-key:not-set, 'test'}`
    }

    await serverless.variables.populateService()
    assert.equal(serverless.service.custom.myVariable, 'test')
  }

  it('should pass through non-AWS variables', async function() {
    const serverless = await createFakeServerless()
    serverless.service.custom.myVar = DEFAULT_VALUE
    await serverless.variables.populateService()
    assert.equal(serverless.service.custom.myVar, DEFAULT_VALUE)
  })

  // eslint-disable-next-line mocha/no-setup-in-describe
  for (const service of Object.keys(CONFIGS)) {
    it(`should resolve ${service}`, async function() {
      testResolve(CONFIGS[service])
    })
    it(`should throw for ${service} not found`, async function() {
      testNotFound(CONFIGS[service])
    })
    it(`should not resolve fallback value for ${service} in strict mode`, async function() {
      testResolveStrictFallback(CONFIGS[service])
    })
    it(`should resolve fallback value for ${service} in non-strict mode`, async function() {
      testResolveFallback(CONFIGS[service])
    })
  }

  it('should throw for keys that are not present', async function() {
    const serverless = await createFakeServerless()

    AWS.mock('Kinesis', 'describeStream', (params, callback) => {
      callback(null, { StreamDescription: { StreamARN: DEFAULT_VALUE } })
    })

    serverless.service.custom.foo = '${aws:kinesis:test-stream:BAD_KEY}' // eslint-disable-line
    expect(serverless.variables.populateService).to.throw(Error)
  })
})
