import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import type { Construct } from 'constructs';

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Creates 2 public + 2 private subnets (1 each per AZ)
    this.vpc = new ec2.Vpc(this, 'MyVPC', {
      maxAzs: 2, // 2 Availability Zones
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public', // For EC2, Bastion
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private', // For RDS
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      natGateways: 0, // No NAT => cost saving
    });
  }
}