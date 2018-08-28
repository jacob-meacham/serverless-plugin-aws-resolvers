/**
 * Created by msills on 4/12/17.
 */

import AWS from 'aws-sdk-mock'
import assert from 'assert'
import {expect} from 'chai'
import Serverless from 'serverless'
import ServerlessAWSResolvers from '../src'

describe('ServerlessAWSResolvers', () => {
  const DEFAULT_VALUE = 'MY_VARIABLE_NAME'

  const CONFIGS = {
    KINESIS: { scope: 'kinesis', service: 'Kinesis', method: 'describeStream', topLevel: 'StreamDescription' },
    DYNAMODB: { scope: 'dynamodb', service: 'DynamoDB', method: 'describeTable', topLevel: 'Table' },
    ECS: { scope: 'ecs', service: 'ElastiCache', method: 'describeCacheClusters', topLevel: 'CacheCluster' },
    ESS: { scope: 'ess', service: 'ES', method: 'describeElasticsearchDomain', topLevel: 'DomainStatus' },
    RDS: {
      scope: 'rds',
      service: 'RDS',
      method: 'describeDBInstances',
      topLevel: 'DBInstances',
      testKey: 'testKey',
      testValue: 'test-value',
      serviceValue: [{testKey: 'test-value'}]
    },
    RDSCHILDVAL: {
      scope: 'rds',
      service: 'RDS',
      method: 'describeDBInstances',
      topLevel: 'DBInstances',
      testKey: 'testKey.testChild',
      testValue: 'test-value',
      serviceValue: [{testKey: {testChild: 'test-value'}}]
    },
    EC2SecurityGroup: {
      scope: 'ec2',
      service: 'EC2',
      method: 'describeSecurityGroups',
      topLevel: 'SecurityGroups',
      subService: 'securityGroup',
      testKey: 'testKey',
      testValue: 'test-value',
      serviceValue: [{testKey: 'test-value'}]
    },
    EC2VPC: {
      scope: 'ec2',
      service: 'EC2',
      method: 'describeVpcs',
      topLevel: 'Vpcs',
      subService: 'vpc',
      testKey: 'testKey',
      testValue: 'test-value',
      serviceValue: [{testKey: 'test-value'}]
    },
    EC2Subnet: {
      scope: 'ec2',
      service: 'EC2',
      method: 'describeSubnets',
      topLevel: 'Subnets',
      subService: 'subnet',
      testKey: 'testKey',
      testValue: 'test-value',
      serviceValue: [{testKey: 'test-value'}]
    }
  }

  afterEach(() => {
    AWS.restore()
  })

  function createFakeServerless() {
    const sls = new Serverless()
    // Attach the plugin
    sls.pluginManager.addPlugin(ServerlessAWSResolvers)
    sls.init()
    return sls
  }

  async function testResolve({scope, service, method, topLevel, subService, testKey, testValue, serviceValue}) {
    testKey = testKey || 'TEST_KEY'
    testValue = testValue || 'TEST_VALUE'
    if (!serviceValue) {
      serviceValue = {}
      serviceValue[testKey] = testValue
    }

    const serverless = createFakeServerless()

    AWS.mock(service, method, (params, callback) => {
      const result = {}
      result[topLevel] = serviceValue
      callback(null, result)
    })

    if (subService) {
      serverless.service.custom.myVariable = `\${aws:${scope}:${subService}:test-key:${testKey}}`
    } else {
      serverless.service.custom.myVariable = `\${aws:${scope}:test-key:${testKey}}`
    }

    await serverless.variables.populateService()
    assert.equal(serverless.service.custom.myVariable, testValue)
  }

  function testNotFound({scope, service, method}) {
    const serverless = createFakeServerless()

    AWS.mock(service, method, (params, callback) => {
      callback(new Error('Not found'))
    })

    serverless.service.custom.myVariable = `\${aws:${scope}:TEST_KEY}`
    expect(serverless.variables.populateService).to.throw(Error)
  }

  function testResolveStrictFallback({scope, service, method, subService, testKey}) {
    const serverless = createFakeServerless()

    serverless.service.custom.awsResolvers = {
      strict: true
    }
    if (subService) {
      serverless.service.custom.myVariable = `\${aws:${scope}:${subService}:test-key:${testKey}, 'test'}`
    } else {
      serverless.service.custom.myVariable = `\${aws:${scope}:test-key:${testKey}, 'test'}`
    }

    AWS.mock(service, method, (params, callback) => {
      callback(new Error('Not found'))
    })

    expect(serverless.variables.populateService).to.throw(Error)
  }

  async function testResolveFallback({scope, service, method, subService, testKey}) {
    const serverless = createFakeServerless()

    serverless.service.custom.awsResolvers = {
      strict: false
    }
    if (subService) {
      serverless.service.custom.myVariable = `\${aws:${scope}:${subService}:test-key:${testKey}, 'test'}`
    } else {
      serverless.service.custom.myVariable = `\${aws:${scope}:test-key:${testKey}, 'test'}`
    }

    AWS.mock(service, method, (params, callback) => {
      callback(new Error('Not found'))
    })

    await serverless.variables.populateService()
    assert.equal(serverless.service.custom.myVariable, 'test')
  }

  it('should pass through non-AWS variables', async () => {
    const serverless = createFakeServerless()
    serverless.service.custom.myVar = DEFAULT_VALUE
    await serverless.variables.populateService()
    assert.equal(serverless.service.custom.myVar, DEFAULT_VALUE)
  })

  for (const service of Object.keys(CONFIGS)) {
    it(`should resolve ${service}`, () => {
      testResolve(CONFIGS[service])
    })
    it(`should throw for ${service} not found`, () => {
      testNotFound(CONFIGS[service])
    })
    it(`should not resolve fallback value for ${service} in strict mode`, () => {
      testResolveStrictFallback(CONFIGS[service])
    })
    it(`should resolve fallback value for ${service} in non-strict mode`, () => {
      testResolveFallback(CONFIGS[service])
    })
  }

  it('should throw for keys that are not present', () => {
    const serverless = createFakeServerless()

    AWS.mock('Kinesis', 'describeStream', (params, callback) => {
      callback(null, {StreamDescription: {StreamARN: DEFAULT_VALUE}})
    })

    serverless.service.custom.foo = '${aws:kinesis:test-stream:BAD_KEY}' // eslint-disable-line
    expect(serverless.variables.populateService).to.throw(Error)
  })
})
