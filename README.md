# serverless-plugin-aws-resolvers
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![Coverage Status](https://coveralls.io/repos/github/jacob-meacham/serverless-plugin-aws-resolvers/badge.svg?branch=develop)](https://coveralls.io/github/jacob-meacham/serverless-plugin-aws-resolvers?branch=develop)
[![Build Status](https://travis-ci.org/jacob-meacham/serverless-plugin-aws-resolvers.svg?branch=develop)](https://travis-ci.org/jacob-meacham/serverless-plugin-aws-resolvers)

A plugin for the serverless framework that resolves deployed AWS services to variables from ESS, RDS, EC2, dynamodb or Kinesis.

# Usage
```yaml
custom:
  # See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ES.html#describeElasticsearchDomain-property
  ess: ${aws:ess:my_cluster_name:Endpoint}
  # See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDS.html#describeDBInstances-property
  rds: ${aws:rds:my_db_name:InstanceCreateTime}
  kinesis: ${aws:kinesis:my_kinesis_stream:StreamARN}
  dynamodb: ${aws:dynamodb:my_dynamodb_table:LatestStreamArn}
  securityGroup: ${aws:ec2:securityGroup:my_vpc_name-my_group_name:GroupId}
  subnet: ${aws:ec2:subnet:my_subnet_name:SubnetId}
  vpc: ${aws:ec2:vpc:my_vpc_name:VpcId}
  ecs: ${aws:ecs:cache_cluster_name:CacheClusterId}
```

Given a service, a key, and a property, this plugin will resolve the variable directly from AWS. This uses the IAM role of the executor of the serverless binary.

This plugin also exposes a command to resolve a variable `sls resolveAwsKey --k aws:ess:my_cluster_name:Endpoint`

See our [webpage](https://jacob-meacham.github.io/serverless-plugin-aws-resolvers/) for full documentation.

## Array access

To access values in arrays (for example the ElastiCache Endpoint in CacheNodes), the `variableSyntax` of serverless needs to be amended.

```yaml
provider:
  variableSyntax: "\\${([ ~:a-zA-Z0-9._\\'\",\\-\\/\\(\\)\\[\\]]+?)}"

  environment:
    ECS_ADDRESS: ${aws:ecs:ecs-instance:CacheNodes[0].Endpoint.Address}
```

# Configurations

This plugin has one available configuration option at the moment.

```yaml
custom:
  awsResolvers:
    strict: true
```

Disabling strict mode allows values of non-existing infrastructure to be overwritten by other values. This is especially useful when the serverless configuration also contains the CloudFormation template to create this infrastructure. On the first run the value would not be available and would prevent the template from being applied.

Values can be overwritten like this:

```yaml
custom:
  awsResolvers:
    strict: false
  rds: ${aws:rds:my_db_name:InstanceCreateTime, 'not created yet'}
```

# Version History
* 1.3.0
  - Add a strict mode flag and don't error on non-existing infrastructure when strict mode is not on (thanks @rmbl)
* 1.2.1
  - Allow object access for the variable name (thanks @rmbl)
* 1.2.0
  - Add support for DynamoDB stream ARN (thanks @geronimo-iia)
* 1.1.0
  - Add support for EC2 resources (thanks @kevgliss)
* 1.0.0
  - Initial release
