variable "project_name" { type = string }
variable "create_nat_gateway" { type = bool }
variable "load_balancer_enabled" { type = bool }
variable "ports_exposed" { type = list(number) }
variable "common_tags" { type = map(string) }
