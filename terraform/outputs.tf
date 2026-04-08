# Output the VPC ID
output "vpc_id" {
  value = aws_vpc.ifca.id
}

# Output the subnet ID
output "subnet_id" {
  value = aws_subnet.ifca.id
}

# Output the database endpoint
output "db_endpoint" {
  value = aws_db_instance.ifca.endpoint
}

# Output the Redis endpoint
output "redis_endpoint" {
  value = aws_elasticache_cluster.ifca.cache_nodes[0].address
}

# Output the ALB DNS name
output "alb_dns_name" {
  value = aws_alb.ifca.dns_name
}
