output "security_logs_bucket" {
  value       = module.website.security_logs_bucket
  description = "S3 bucket for security and application logs."
}

output "app_log_group" {
  value       = module.observability.log_group_name
  description = "CloudWatch log group for runtime logs."
}

output "instance_public_ip" {
  value       = module.compute.instance_public_ip
  description = "Public IP of EC2 instance."
}

output "ec2_instance_id" {
  value       = module.compute.instance_id
  description = "EC2 instance id."
}

output "ec2_instance_type" {
  value       = module.compute.instance_type
  description = "EC2 instance type."
}

output "ec2_ami_id" {
  value       = module.compute.ami_id
  description = "AMI id used for EC2."
}

output "ec2_public_dns" {
  value       = module.compute.public_dns
  description = "EC2 public DNS."
}

output "ec2_availability_zone" {
  value       = module.compute.availability_zone
  description = "EC2 availability zone."
}

output "ec2_subnet_id" {
  value       = module.compute.subnet_id
  description = "Subnet id where EC2 is deployed."
}

output "ec2_vpc_security_group_ids" {
  value       = module.compute.vpc_security_group_ids
  description = "Security groups attached to EC2."
}

output "ec2_key_name" {
  value       = module.compute.ec2_key_name
  description = "Selected EC2 key pair name."
}

output "generated_ec2_private_key_pem" {
  value       = module.compute.generated_private_key_pem
  description = "Generated private key PEM when existing key name is not provided."
  sensitive   = true
}

output "vpc_id" {
  value       = module.network.vpc_id
  description = "Target VPC id."
}

output "subnet_ids" {
  value       = module.network.subnet_ids
  description = "Candidate subnet ids in VPC."
}

output "selected_subnet_id" {
  value       = module.network.selected_subnet_id
  description = "Subnet selected for EC2 placement."
}

output "web_security_group_id" {
  value       = module.security.web_security_group_id
  description = "Security group used for web ingress."
}

output "instance_url" {
  value       = module.compute.instance_url
  description = "HTTP endpoint of EC2 instance."
}

output "website_bucket" {
  value       = module.website.website_bucket
  description = "S3 bucket hosting static site assets."
}

output "cloudfront_domain_name" {
  value       = module.website.cloudfront_domain_name
  description = "CloudFront domain name."
}

output "cloudfront_url" {
  value       = module.website.cloudfront_url
  description = "Public CloudFront URL."
}

output "s3_website_endpoint" {
  value       = module.website.s3_website_endpoint
  description = "S3 website endpoint."
}
