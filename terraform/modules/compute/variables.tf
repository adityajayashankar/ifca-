variable "project_name" { type = string }
variable "aws_region" { type = string }
variable "services" { type = list(any) }
variable "vpc_id" { type = string }
variable "public_subnet_ids" { type = list(string) }
variable "private_subnet_ids" { type = list(string) }
variable "alb_security_group_id" { type = string }
variable "app_security_group_id" { type = string }
variable "ecs_execution_role_arn" { type = string }
variable "ecs_task_role_arn" { type = string }
variable "ecr_repository_name" { type = string }
variable "load_balancer_enabled" { type = bool }
variable "desired_log_group_name" {
  type    = string
  default = null
}
variable "log_group_override" {
  type    = string
  default = null
}
variable "log_retention_days" { type = number }
variable "common_tags" { type = map(string) }
