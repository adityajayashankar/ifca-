locals {
  common_tags = {
    Project     = var.project_name
    ManagedBy   = "deplai"
    Environment = var.environment
  }
}

module "network" {
  source = "./modules/network"

  preferred_availability_zones = var.preferred_availability_zones
}

module "security" {
  source = "./modules/security"

  project_name        = var.project_name
  vpc_id              = module.network.vpc_id
  ingress_cidr_blocks = var.ingress_cidr_blocks
  tags                = local.common_tags
}

module "compute" {
  source = "./modules/compute"

  project_name                = var.project_name
  enable_ec2                  = var.enable_ec2
  instance_type               = var.instance_type
  subnet_id                   = module.network.selected_subnet_id
  vpc_security_group_ids      = [module.security.web_security_group_id]
  existing_ec2_key_pair_name  = var.existing_ec2_key_pair_name
  ec2_root_volume_size        = var.ec2_root_volume_size
  bootstrap_index_html_base64 = var.bootstrap_index_html_base64
  tags                        = local.common_tags
}

module "website" {
  source = "./modules/website"

  project_name              = var.project_name
  site_asset_root           = "${path.root}/site"
  block_public_access       = var.website_block_public_access
  force_destroy_site_bucket = var.force_destroy_site_bucket
  tags                      = local.common_tags
}

module "observability" {
  source = "./modules/observability"

  project_name       = var.project_name
  environment        = var.environment
  log_retention_days = var.log_retention_days
  enable_ec2         = var.enable_ec2
  instance_id        = try(module.compute.instance_id, "")
  tags               = local.common_tags
}

# Security context snapshot:
# - Code findings: 2874
# - Supply findings: 196
# - Critical/high supply findings: 100
# - High-impact CWEs: 798, 943, 134, 79, 918
