# Configure the Terraform backend
terraform {
  backend "s3" {
    bucket = "ifca-terraform-state"
    key    = "ifca/terraform.tfstate"
    region = "us-west-2"
  }
}
