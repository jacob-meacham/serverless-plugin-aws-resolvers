export const defaultValues = {
  name: 'MY_VARIABLE_NAME',
  key: 'TEST_KEY',
  value: 'TEST_VALUE'
}

export const serviceConfs = {
  Kinesis: {
    scope: 'kinesis',
    service: 'Kinesis',
    mocks: { StreamDescription: 'describeStream' },
    MockType: Object,
    tests: {TooManyResults: false}
  },
  DynamoDB: {
    scope: 'dynamodb',
    service: 'DynamoDB',
    mocks: { Table: 'describeTable' },
    MockType: Object,
    tests: {TooManyResults: false}
  },
  Ecs: {
    scope: 'ecs',
    service: 'ElastiCache',
    mocks: { CacheClusters: 'describeCacheClusters' },
    serviceValue: [{testKey: 'test-value'}],
    testKey: 'testKey',
    testValue: 'test-value'
  },
  Ess: {
    scope: 'ess',
    service: 'ES',
    mocks: { DomainStatus: 'describeElasticsearchDomain' },
    MockType: Object,
    tests: {TooManyResults: false}
  },
  Rds: {
    scope: 'rds',
    service: 'RDS',
    mocks: { DBInstances: 'describeDBInstances' },
    testKey: 'testKey',
    testValue: 'test-value',
    serviceValue: [{testKey: 'test-value'}]
  },
  RdsChildVal: {
    scope: 'rds',
    service: 'RDS',
    mocks: { DBInstances: 'describeDBInstances' },
    testKey: 'testKey.testChild',
    testValue: 'test-value',
    serviceValue: [{testKey: {testChild: 'test-value'}}]
  },
  EC2SecurityGroup: {
    scope: 'ec2',
    service: 'EC2',
    mocks: { Vpcs: 'describeVpcs', SecurityGroups: 'describeSecurityGroups' },
    subService: 'securityGroup',
    testKey: 'testKey',
    testValue: 'test-value',
    serviceValue: [{testKey: 'test-value'}]
  },
  EC2VPC: {
    scope: 'ec2',
    service: 'EC2',
    mocks: { Vpcs: 'describeVpcs' },
    subService: 'vpc',
    testKey: 'testKey',
    testValue: 'test-value',
    serviceValue: [{testKey: 'test-value'}]
  },
  EC2Subnet: {
    scope: 'ec2',
    service: 'EC2',
    mocks: { Subnets: 'describeSubnets' },
    subService: 'subnet',
    testKey: 'testKey',
    testValue: 'test-value',
    serviceValue: [{testKey: 'test-value'}]
  }
}
