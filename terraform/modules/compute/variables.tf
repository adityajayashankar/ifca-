variable "project_name" {
  type = string
}

variable "enable_ec2" {
  type = bool
}

variable "instance_type" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "vpc_security_group_ids" {
  type = list(string)
}

variable "existing_ec2_key_pair_name" {
  type = string
}

variable "ec2_root_volume_size" {
  type = number
}

variable "bootstrap_index_html_base64" {
  type      = string
  sensitive = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
