output "vpc_id" {
  value = data.aws_vpc.default.id
}

output "subnet_ids" {
  value = data.aws_subnets.default_in_vpc.ids
}

output "selected_subnet_id" {
  value = local.selected_subnet_id
}
