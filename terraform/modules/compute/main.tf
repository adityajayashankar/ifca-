data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

resource "random_id" "suffix" {
  byte_length = 3
}

resource "tls_private_key" "ec2_ssh" {
  count     = var.enable_ec2 && trimspace(var.existing_ec2_key_pair_name) == "" ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "generated" {
  count      = var.enable_ec2 && trimspace(var.existing_ec2_key_pair_name) == "" ? 1 : 0
  key_name   = "${var.project_name}-ssh-${random_id.suffix.hex}"
  public_key = tls_private_key.ec2_ssh[0].public_key_openssh

  tags = merge(var.tags, {
    Name = "${var.project_name}-ssh"
  })
}

locals {
  selected_ec2_key_name = !var.enable_ec2
    ? null
    : (
      trimspace(var.existing_ec2_key_pair_name) != ""
      ? trimspace(var.existing_ec2_key_pair_name)
      : try(aws_key_pair.generated[0].key_name, null)
    )
}

resource "aws_instance" "app" {
  count                       = var.enable_ec2 && trimspace(var.subnet_id) != "" ? 1 : 0
  ami                         = data.aws_ami.amazon_linux.id
  instance_type               = var.instance_type
  key_name                    = local.selected_ec2_key_name
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = var.vpc_security_group_ids
  associate_public_ip_address = true

  root_block_device {
    volume_size           = var.ec2_root_volume_size
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  user_data = <<-EOT
    #!/bin/bash
    set -euxo pipefail
    dnf update -y
    dnf install -y nginx
    systemctl enable nginx
    echo '${var.bootstrap_index_html_base64}' | base64 -d > /usr/share/nginx/html/index.html
    systemctl restart nginx
  EOT

  tags = merge(var.tags, {
    Name = "${var.project_name}-app"
  })
}
