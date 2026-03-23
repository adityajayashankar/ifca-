variable "project_name" {
  type = string
}

variable "site_asset_root" {
  type = string
}

variable "block_public_access" {
  type = bool
}

variable "force_destroy_site_bucket" {
  type = bool
}

variable "tags" {
  type    = map(string)
  default = {}
}
