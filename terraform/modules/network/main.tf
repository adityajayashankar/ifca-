data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default_in_vpc" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_subnet" "default_details" {
  for_each = toset(data.aws_subnets.default_in_vpc.ids)
  id       = each.value
}

locals {
  preferred_subnet_ids = [
    for subnet in data.aws_subnet.default_details :
    subnet.id if contains(var.preferred_availability_zones, subnet.availability_zone)
  ]

  selected_subnet_id = length(local.preferred_subnet_ids) > 0
    ? local.preferred_subnet_ids[0]
    : (length(data.aws_subnets.default_in_vpc.ids) > 0 ? data.aws_subnets.default_in_vpc.ids[0] : "")
}
