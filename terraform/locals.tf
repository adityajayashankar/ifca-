locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "deplai"
  }

  services = jsondecode(<<JSON
[{"id": "api", "process_type": "web", "image_source": "placeholder", "cpu": 256, "memory": 512, "port": 5432, "desired_count": 1, "autoscaling": {"min": 1, "max": 3, "target_cpu": 60, "target_memory": 70}}]
JSON
  )

  networking = jsondecode(<<JSON
{"vpc": "new", "layout": "public_subnets", "nat_gateway": false, "load_balancer": {"type": "alb", "public": false, "services": []}, "ports_exposed": []}
JSON
  )

  data_layer = jsondecode(<<JSON
[{"id": "primary_db", "type": "postgresql", "engine_version": "latest", "instance_class": "db.t3.small", "multi_az": false, "storage_gb": 20, "backup_retention_days": 7, "purpose": []}, {"id": "cache", "type": "redis", "engine_version": "7.0", "node_type": "cache.t3.small", "cluster_mode": false, "purpose": ["cache"]}]
JSON
  )

  runtime_config = jsondecode(<<JSON
{"required_secrets": [], "config_values": [], "secrets_manager_prefix": "/ifca/dev"}
JSON
  )

  build_pipeline = jsondecode(<<JSON
{"build_command": "next build", "start_command": "next start", "ecr_repository": "ifca", "provision_codepipeline": false}
JSON
  )
}
