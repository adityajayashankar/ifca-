# Output variables
output "vpc_id" {
  value = aws_vpc.ifca-.id
}

output "subnet_id" {
  value = aws_subnet.ifca-.id
}

output "security_group_id" {
  value = aws_security_group.ifca-.id
}

output "db_instance_id" {
  value = aws_db_instance.ifca-.id
}

output "redis_cluster_id" {
  value = aws_elasticache_cluster.ifca-.id
}

output "ecs_cluster_id" {
  value = aws_ecs_cluster.ifca-.id
}

output "ecs_service_id" {
  value = aws_ecs_service.ifca-.id
}
