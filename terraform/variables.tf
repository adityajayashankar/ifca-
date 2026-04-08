# Variable for the AWS region
variable "aws_region" {
  type        = string
  default     = "us-west-2"
}

# Variable for the VPC CIDR block
variable "vpc_cidr" {
  type        = string
  default     = "10.0.0.0/16"
}

# Variable for the subnet CIDR block
variable "subnet_cidr" {
  type        = string
  default     = "10.0.1.0/24"
}

# Variable for the database username
variable "db_username" {
  type        = string
  default     = "ifca"
}

# Variable for the database password
variable "db_password" {
  type        = string
  default     = "ifca"
}

# Variable for the Redis engine version
variable "redis_engine_version" {
  type        = string
  default     = "7.0"
}
