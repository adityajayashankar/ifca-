variable "project_name" {
  type    = string
  default = "ifca"
}

variable "aws_region" {
  type    = string
  default = "eu-north-1"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "enable_ec2" {
  type    = bool
  default = true
}

variable "existing_ec2_key_pair_name" {
  type    = string
  default = ""
}

variable "ingress_cidr_blocks" {
  type    = list(string)
  default = ["0.0.0.0/0"]
}

variable "ssh_ingress_cidr_blocks" {
  type    = list(string)
  default = []
}

variable "preferred_availability_zones" {
  type    = list(string)
  default = ["eu-north-1a", "eu-north-1b", "eu-north-1c"]
}

variable "use_default_vpc" {
  type    = bool
  default = true
}

variable "vpc_cidr_block" {
  type    = string
  default = "10.42.0.0/16"
}

variable "public_subnet_cidr" {
  type    = string
  default = "10.42.1.0/24"
}

variable "force_destroy_site_bucket" {
  type    = bool
  default = false
}

variable "ec2_root_volume_size" {
  type    = number
  default = 8
}

variable "bootstrap_index_html_base64" {
  type      = string
  default   = "PCFET0NUWVBFIGh0bWw+DQo8aHRtbCBsYW5nPSJlbiI+DQogIDxoZWFkPg0KICAgIDxtZXRhIGNoYXJzZXQ9InV0Zi04IiAvPg0KICAgIDxsaW5rIHJlbD0iaWNvbiIgaHJlZj0iJVBVQkxJQ19VUkwlL2Zhdmljb24uaWNvIiAvPg0KICAgIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MSIgLz4NCiAgICA8bGluayByZWw9InByZWNvbm5lY3QiIGhyZWY9Imh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20iPjxsaW5rIHJlbD0icHJlY29ubmVjdCIgaHJlZj0iaHR0cHM6Ly9mb250cy5nc3RhdGljLmNvbSIgY3Jvc3NvcmlnaW4+DQogICAgPGxpbmsgaHJlZj0iaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbS9jc3MyP2ZhbWlseT1NYXZlbitQcm86d2dodEA0MDA7NTAwOzYwMDs3MDA7ODAwOzkwMCZkaXNwbGF5PXN3YXAiIHJlbD0ic3R5bGVzaGVldCI+DQogICAgPHRpdGxlPklGQ0E8L3RpdGxlPg0KICAgIDxzdHlsZT4NCiAgICAgIEBpbXBvcnQgdXJsKCdodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tL2NzczI/ZmFtaWx5PU1hdmVuK1Bybzp3Z2h0QDQwMDs1MDA7NjAwOzcwMDs4MDA7OTAwJmRpc3BsYXk9c3dhcCcpOw0KDQogICAgICAqew0KICAgICAgICBmb250LWZhbWlseTogJ01hdmVuIFBybycsIHNhbnMtc2VyaWY7DQogICAgICB9DQogICAgPC9zdHlsZT4NCiAgPC9oZWFkPg0KICA8Ym9keT4NCiAgICA8bm9zY3JpcHQ+WW91IG5lZWQgdG8gZW5hYmxlIEphdmFTY3JpcHQgdG8gcnVuIHRoaXMgYXBwLjwvbm9zY3JpcHQ+DQogICAgPGRpdiBpZD0icm9vdCI+PC9kaXY+DQogIDwvYm9keT4NCiAgDQo8L2h0bWw+"
  sensitive = true
}

variable "context_summary" {
  type    = string
  default = ""
}
