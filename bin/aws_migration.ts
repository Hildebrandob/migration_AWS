#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/aws_vpc';
import { SecurityStack } from '../lib/policies-stack';
import { Ec2RdsStack } from '../lib/EC2-RDS-stack';

const app = new cdk.App();

// 1) Deploy the VPC stack
const vpcStack = new VpcStack(app, 'VpcStack');

// 2) Deploy the Security stack (using a trusted IP instead of exposing a personal IP)
const securityStack = new SecurityStack(app, 'SecurityStack', {
  vpc: vpcStack.vpc,
});

// 3) Deploy the EC2 & RDS stack
new Ec2RdsStack(app, 'Ec2RdsStack', {
  vpc: vpcStack.vpc,
  ec2SecurityGroup: securityStack.ec2SecurityGroup,
  bastionSecurityGroup: securityStack.bastionSecurityGroup,
  rdsSecurityGroup: securityStack.rdsSecurityGroup,
});



 /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */