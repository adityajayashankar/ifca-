variable "project_name" { type = string }
variable "postgres_config" { type = any }
variable "redis_config" { type = any }
variable "private_subnet_ids" { type = list(string) }
variable "db_security_group_id" { type = string }
variable "cache_security_group_id" { type = string }
variable "common_tags" { type = map(string) }
