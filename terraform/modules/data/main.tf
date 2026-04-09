resource "aws_db_subnet_group" "main" {
  count      = var.postgres_config == null ? 0 : 1
  name       = "${var.project_name}-db-subnets"
  subnet_ids = var.private_subnet_ids
  tags       = var.common_tags
}

resource "aws_db_instance" "main" {
  count                   = var.postgres_config == null ? 0 : 1
  identifier              = "${var.project_name}-postgres"
  engine                  = "postgres"
  engine_version          = try(var.postgres_config.engine_version, "15.4")
  instance_class          = try(var.postgres_config.instance_class, "db.t3.small")
  allocated_storage       = try(var.postgres_config.storage_gb, 20)
  storage_type            = "gp3"
  db_subnet_group_name    = aws_db_subnet_group.main[0].name
  vpc_security_group_ids  = [var.db_security_group_id]
  username                = "deplai"
  password                = "ChangeMe123!"
  skip_final_snapshot     = true
  publicly_accessible     = false
  backup_retention_period = try(var.postgres_config.backup_retention_days, 7)
  multi_az                = try(var.postgres_config.multi_az, false)
  tags                    = var.common_tags
}

resource "aws_elasticache_subnet_group" "main" {
  count      = var.redis_config == null ? 0 : 1
  name       = "${var.project_name}-cache-subnets"
  subnet_ids = var.private_subnet_ids
}

resource "aws_elasticache_cluster" "main" {
  count               = var.redis_config == null ? 0 : 1
  cluster_id          = "${var.project_name}-redis"
  engine              = "redis"
  node_type           = try(var.redis_config.node_type, "cache.t3.small")
  num_cache_nodes     = 1
  port                = 6379
  subnet_group_name   = aws_elasticache_subnet_group.main[0].name
  security_group_ids  = [var.cache_security_group_id]
}
