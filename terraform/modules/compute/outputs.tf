output "instance_public_ip" {
  value = try(aws_instance.app[0].public_ip, null)
}

output "instance_id" {
  value = try(aws_instance.app[0].id, null)
}

output "instance_type" {
  value = try(aws_instance.app[0].instance_type, null)
}

output "ami_id" {
  value = try(aws_instance.app[0].ami, null)
}

output "public_dns" {
  value = try(aws_instance.app[0].public_dns, null)
}

output "availability_zone" {
  value = try(aws_instance.app[0].availability_zone, null)
}

output "subnet_id" {
  value = try(aws_instance.app[0].subnet_id, null)
}

output "vpc_security_group_ids" {
  value = try(aws_instance.app[0].vpc_security_group_ids, [])
}

output "ec2_key_name" {
  value = local.selected_ec2_key_name
}

output "generated_private_key_pem" {
  value     = try(tls_private_key.ec2_ssh[0].private_key_pem, null)
  sensitive = true
}

output "instance_url" {
  value = try("http://${aws_instance.app[0].public_ip}", null)
}
