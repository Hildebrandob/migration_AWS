import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import type { Construct } from 'constructs';

interface SecurityStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class SecurityStack extends cdk.Stack {
  public readonly ec2SecurityGroup: ec2.SecurityGroup;
  public readonly bastionSecurityGroup: ec2.SecurityGroup;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // Production-safe: allow SSH only from a trusted IP (replace with your CIDR)
    this.ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: props.vpc,
      description: 'Allow SSH from trusted IP only',
    });
    this.ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/32'),
      ec2.Port.tcp(22),
      'Allow SSH from trusted IP'
    );

    this.ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('81.97.144.236/32'),
      ec2.Port.tcp(22),
      'Allow SSH from current public IP'
    );

    // Bastion SG: also restrict SSH to the trusted IP
    this.bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
      vpc: props.vpc,
      description: 'Allow SSH from trusted IP only for Bastion',
    });
    this.bastionSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/32'),
      ec2.Port.tcp(22),
      'Allow SSH from trusted IP'
    );
    this.bastionSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('81.97.144.236/32'),
      ec2.Port.tcp(22),
      'Allow SSH from current public IP'
    );

    // RDS SG: allow MySQL (port 3306) only from the Bastion SG
    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc: props.vpc,
      description: 'Allow MySQL from Bastion only',
    });
    this.rdsSecurityGroup.addIngressRule(
      this.bastionSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL from Bastion'
    );
  }
}
