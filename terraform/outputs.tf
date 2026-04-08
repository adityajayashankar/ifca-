# Output the VPC ID
output "vpc_id" {
  value = aws_vpc.ifca.id
}

# Output the subnet ID
output "subnet_id" {
  value = aws_subnet.ifca.id
}

# Output the security group ID
output "security_group_id" {
  value = aws_security_group.ifca.id
}

# Output the database instance ID
output "db_instance_id" {
  value = aws_db_instance.ifca.id
}

# Output the Redis cache cluster ID
output "redis_cluster_id" {
  value = aws_elasticache_cluster.ifca.id
}

# Output the ECS cluster ID
output "ecs_cluster_id" {
  value = aws_ecs_cluster.ifca.id
}

# Output the ALB ID
output "alb_id" {
  value = aws_alb.ifca.id
}
