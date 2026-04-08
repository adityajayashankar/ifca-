output "alb_dns_name" {
  value = module.compute.alb_dns_name
}

output "ecs_cluster_name" {
  value = module.compute.ecs_cluster_name
}

output "ecs_service_names" {
  value = module.compute.ecs_service_names
}

output "ecr_repository_url" {
  value = module.compute.ecr_repository_url
}

output "rds_endpoint" {
  value = module.data.postgres_endpoint
}

output "redis_endpoint" {
  value = module.data.redis_endpoint
}
