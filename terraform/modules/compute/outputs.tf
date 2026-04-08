output "alb_dns_name" { value = try(aws_lb.main[0].dns_name, null) }
output "ecs_cluster_name" { value = aws_ecs_cluster.main.name }
output "ecs_service_names" { value = values(aws_ecs_service.service)[*].name }
output "ecr_repository_url" { value = aws_ecr_repository.app.repository_url }
output "service_endpoint" { value = try(aws_lb.main[0].dns_name, null) }
output "log_group_name" { value = aws_cloudwatch_log_group.ecs.name }
