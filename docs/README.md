# serverless-aws-arn-resolver
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![Coverage Status](https://img.shields.io/coveralls/github/lumberjackotters/serverless-aws-arn-resolver/master?style=flat-square)](https://coveralls.io/github/lumberjackotters/serverless-aws-arn-resolver?branch=master)
[![Build Status](https://img.shields.io/travis/lumberjackotters/serverless-aws-arn-resolver/master?style=flat-square)](https://travis-ci.org/lumberjackotters/serverless-aws-arn-resolver)
A plugin for the serverless framework that resolves deployed AWS services to variables from ESS, RDS, EC2, dynamodb or Kinesis.

# Usage
```yaml
arn_examples:
  # See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ES.html
  ess: ${aws:ess:my_cluster_name:Endpoint}
  # See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDS.html
  rds: ${aws:rds:my_db_name:InstanceCreateTime}
  # See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Kinesis.html
  kinesis: ${aws:kinesis:my_kinesis_stream:StreamARN}
  # See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html
  dynamodb: ${aws:dynamodb:my_dynamodb_table:LatestStreamArn}
  # See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html
  securityGroup: ${aws:ec2:securityGroup:my_vpc_name-my_group_name:GroupId}
  # See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html
  subnet: ${aws:ec2:subnet:my_subnet_name:SubnetId}
  # See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html
  vpc: ${aws:ec2:vpc:my_vpc_name:VpcId}
  # See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ECS.html
  ecs: ${aws:ecs:cache_cluster_name:CacheClusterId}
```

Given a service, a key, and a property, this plugin will resolve the variable directly from AWS. This uses the IAM role of the executor of the serverless binary.

This plugin also exposes a command to resolve a variable `sls resolveAwsKey --k aws:ess:my_cluster_name:Endpoint`

See our [webpage](https://lumberjackotters.github.io/serverless-aws-arn-resolver/) for full documentation.
See our Changelog at https://lumberjackotters.github.io/serverless-aws-arn-resolver/CHANGELOG

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
