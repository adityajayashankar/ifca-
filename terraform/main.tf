module "networking" {
  source                = "./modules/networking"
  project_name          = var.project_name
  create_nat_gateway    = try(local.networking.nat_gateway, true)
  load_balancer_enabled = true
  ports_exposed         = [for svc in local.services : try(svc.port, 0) if try(svc.port, 0) > 0]
  common_tags           = local.common_tags
}

module "iam" {
  source               = "./modules/iam"
  project_name         = var.project_name
  required_secret_names = try(local.runtime_config.required_secrets, [])
  common_tags          = local.common_tags
}

module "data" {
  source            = "./modules/data"
  project_name      = var.project_name
  postgres_config   = try([for item in local.data_layer : item if try(item.type, "") == "postgresql"][0], null)
  redis_config      = try([for item in local.data_layer : item if try(item.type, "") == "redis"][0], null)
  private_subnet_ids = module.networking.private_subnet_ids
  db_security_group_id = module.networking.db_security_group_id
  cache_security_group_id = module.networking.cache_security_group_id
  common_tags       = local.common_tags
}

module "compute" {
  source                = "./modules/compute"
  project_name          = var.project_name
  aws_region            = var.aws_region
  services              = local.services
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  private_subnet_ids    = module.networking.private_subnet_ids
  alb_security_group_id = module.networking.alb_security_group_id
  app_security_group_id = module.networking.app_security_group_id
  ecs_execution_role_arn = module.iam.ecs_execution_role_arn
  ecs_task_role_arn     = module.iam.ecs_task_role_arn
  ecr_repository_name   = try(local.build_pipeline.ecr_repository, var.project_name)
  desired_log_group_name = try(local.runtime_config.log_group_name, null)
  log_group_override    = null
  log_retention_days    = 30
  load_balancer_enabled = true
  common_tags           = local.common_tags
}
