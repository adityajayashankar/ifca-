# Define input variables
variable "region" {
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr" {
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_cidr" {
  type        = string
  default     = "10.0.1.0/24"
}

variable "availability_zone" {
  type        = string
  default     = "us-west-2a"
}

variable "instance_type" {
  type        = string
  default     = "t3.small"
}

variable "db_instance_class" {
  type        = string
  default     = "db.t3.small"
}

variable "db_engine" {
  type        = string
  default     = "postgres"
}

variable "db_engine_version" {
  type        = string
  default     = "14.3"
}

variable "db_username" {
  type        = string
  default     = "ifca"
}

variable "db_password" {
  type        = string
  default     = "ifca"
}

variable "db_name" {
  type        = string
  default     = "ifca"
}

variable "redis_engine_version" {
  type        = string
  default     = "7.0"
}

variable "redis_node_type" {
  type        = string
  default     = "cache.t3.small"
}
