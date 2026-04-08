# Input variables
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

variable "db_instance_class" {
  type        = string
  default     = "db.t3.small"
}

variable "db_engine_version" {
  type        = string
  default     = "14.3"
}

variable "db_allocated_storage" {
  type        = number
  default     = 20
}

variable "db_username" {
  type        = string
  default     = "ifca-"
}

variable "db_password" {
  type        = string
  default     = "ifca-"
}

variable "redis_node_type" {
  type        = string
  default     = "cache.t3.small"
}

variable "redis_engine_version" {
  type        = string
  default     = "7.0"
}
