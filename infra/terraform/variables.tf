variable "project" {
  description = "Short project name, used as a prefix for resources."
  type        = string
  default     = "ecomsaas"
}

variable "location" {
  description = "Azure region."
  type        = string
  default     = "australiaeast"
}

variable "app_service_sku" {
  description = "App Service Plan SKU. Needs a tier that supports deployment slots (P1v2+)."
  type        = string
  default     = "P1v2"
}

variable "vm_size" {
  description = "Size of the Jenkins/Sonar/monitoring VM."
  type        = string
  default     = "Standard_D2s_v3"
}

variable "vm_admin_username" {
  description = "Admin username for the Jenkins VM."
  type        = string
  default     = "azureuser"
}

variable "vm_ssh_public_key" {
  description = "SSH public key for the Jenkins VM (contents of your .pub file)."
  type        = string
}

variable "mysql_admin_username" {
  description = "MySQL Flexible Server admin login."
  type        = string
  default     = "ecomadmin"
}

variable "db_name" {
  description = "Application database name."
  type        = string
  default     = "ecom_saas_db"
}

variable "allowed_admin_cidr" {
  description = "Your public IP in CIDR form (e.g. 1.2.3.4/32) for VM SSH + management ports. Lock this down."
  type        = string
}

variable "image_name" {
  description = "Container image repository name inside ACR."
  type        = string
  default     = "ecom-saas"
}
