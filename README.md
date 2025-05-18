# AWS migration infrastructure

In this project, I will create a IaC project for a patient portal web application that needs to be modernized and migrated to Infrastructure as Code, considering the current situation and what they require for their new infrastructure.

Lib folder contains all the the required infrastucture including: VPC stack, security policies stack and the stack the creates the EC2 intances, Bastion hosts, RDS databases annd secrets Manager policies

[Project descrption in Medium](https://medium.com/@brandi_lon/aws-migration-infrastructure-b9b1ba69b63a)

## Requirements
Infrastructure Migration to CDK
Implement the following using AWS CDK with TypeScript:

VPC with 2 Availability Zones

1 public subnet per AZ

1 private subnet per AZ

Security Groups for EC2 and RDS

EC2 instance in public subnet

RDS instance in private subnet

Necessary IAM roles and policies

## Demonstrate:

Successful EC2 to RDS connectivity

Security group configurations working as intended

Network isolation is properly configured

Infrastructure can be destroyed and recreated consistently

Cost Considerations

Use t2.micro for EC2 as this is free tier

Use db.t3.micro for RDS for minimum cost

Avoid NAT Gateways to save cots

Destroy resources after testing

## Network Design:

Separate public and private subnets

Security group with least privilege access

## Security:

No direct public access to RDS

EC2 instance only accessible via SSH from your IP

Database credentials stored securely

Use of security groups instead of NACLs where possible
