# serverless-plugin-aws-resolvers
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![Coverage Status](https://coveralls.io/repos/github/DopplerLabs/serverless-plugin-aws-resolvers/badge.svg?branch=develop)](https://coveralls.io/github/DopplerLabs/serverless-plugin-aws-resolvers?branch=develop)
[![Build Status](https://travis-ci.org/DopplerLabs/serverless-plugin-aws-resolvers.svg?branch=develop)](https://travis-ci.org/DopplerLabs/serverless-plugin-aws-resolvers)

A plugin for the serverless framework that resolves deployed AWS services to variables from ESS, RDS, or Kinesis.

# Usage
```yaml
custom:
  # See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ES.html#describeElasticsearchDomain-property
  ess: ${aws:ess:my_cluster_name:Endpoint}
  # See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDS.html#describeDBInstances-property
  rds: ${aws:rds:my_db_name:InstanceCreateTime}
  kinesis: ${aws:kinesis:my_kinesis_stream:StreamARN}
  securityGroup: ${aws:ec2:my_vpc-my_group_name:GroupId}
  vpc: ${aws.ec2:my_vpc_name:VpcId}
  subnet: ${aws.ec2.my_subnet_name:SubnetId}
```

Given a service, a key, and a property, this plugin will resolve the variable directly from AWS. This uses the IAM role of the executor of the serverless binary.

This plugin also exposes a command to resolve a variable `sls resolveAwsKey --k aws:ess:my_cluster_name:Endpoint`

See our [webpage](https://dopplerlabs.github.io/serverless-plugin-aws-resolvers/) for full documentation.

# Version History
* 1.0.0
  - Initial release
