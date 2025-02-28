import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import type { Construct } from 'constructs';

interface Ec2RdsStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  ec2SecurityGroup: ec2.SecurityGroup;
  bastionSecurityGroup: ec2.SecurityGroup;
  rdsSecurityGroup: ec2.SecurityGroup;
}

export class Ec2RdsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Ec2RdsStackProps) {
    super(scope, id, props);

    const { vpc, ec2SecurityGroup, bastionSecurityGroup, rdsSecurityGroup } = props;

    // Use an existing key pair (the key pair "bastion" must exist in the target region)
    const keyPair = ec2.KeyPair.fromKeyPairName(this, 'SharedKeyPair', 'bastion');

    // Select public and private subnets from the VPC.
    const publicSubnets = vpc.selectSubnets({ subnetGroupName: 'Public' }).subnets;
    const privateSubnets = vpc.selectSubnets({ subnetGroupName: 'Private' }).subnets;
    

    // (A) Create one public EC2 instance in each public subnet.
    publicSubnets.forEach((subnet, index) => {
      new ec2.Instance(this, `PublicEC2Instance-${index}`, {
        vpc,
        vpcSubnets: { subnets: [subnet] },
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: ec2SecurityGroup,
        keyPair,
        associatePublicIpAddress: true, // This instructs AWS to automatically assign a public IP.
      });
    });

    // (B) Create an RDS Subnet Group for the private subnets.
    const rdsSubnetGroup = new rds.SubnetGroup(this, 'RDSSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS across Private subnets',
      vpcSubnets: { subnets: privateSubnets },
    });

    // (C) For each private subnet, create:
    //      1) A Bastion host (in the matching public subnet) with an Elastic IP for a static public address.
    //      2) An RDS instance in the private subnet.
    privateSubnets.forEach((privateSubnet, index) => {
      // Determine the matching public subnet (by index; assumes same AZ order).
      const matchingPublicSubnet = publicSubnets[index];

      // Create the Bastion host in the matching public subnet.
      const bastion = new ec2.Instance(this, `BastionHost-${index}`, {
        vpc,
        vpcSubnets: { subnets: [matchingPublicSubnet] },
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: bastionSecurityGroup,
        keyPair,
        associatePublicIpAddress: true, // Ensure it gets a public IP.
      });

      // Allocate an Elastic IP for this Bastion host so its public IP remains static.
      new ec2.CfnEIP(this, `BastionEIP-${index}`, {
        instanceId: bastion.instanceId,
      });

      // Create a Secret in Secrets Manager to securely store the RDS credentials.
      const dbSecret = new secretsmanager.Secret(this, `RDSSecret-${index}`, {
        secretName: `MyRDSSecret${index}`,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'admin' }),
          generateStringKey: 'password',
          excludePunctuation: true,
        },
      });

      // Create an RDS MySQL instance in the private subnet.
      new rds.DatabaseInstance(this, `NewRDSInstance-${index}`, {
        engine: rds.DatabaseInstanceEngine.mysql({ version: rds.MysqlEngineVersion.VER_8_0 }),
        vpc,
        vpcSubnets: { subnets: [privateSubnet] },
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
        securityGroups: [rdsSecurityGroup],
        credentials: rds.Credentials.fromSecret(dbSecret),
        subnetGroup: rdsSubnetGroup,
        multiAz: false, // For high availability in production, consider true.
        allocatedStorage: 20,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Change as needed for production.
      });
    });
  }
}
