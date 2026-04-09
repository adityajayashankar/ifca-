output "postgres_endpoint" { value = try(aws_db_instance.main[0].address, null) }
output "redis_endpoint" { value = try(aws_elasticache_cluster.main[0].cache_nodes[0].address, null) }
