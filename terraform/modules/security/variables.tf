variable "project_name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "ingress_cidr_blocks" {
  type        = list(string)
  description = "Allowed ingress CIDR blocks."
}

variable "tags" {
  type    = map(string)
  default = {}
}
