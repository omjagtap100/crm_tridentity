locals {
  prefix = var.project
  tags = {
    project = var.project
    purpose = "SIT753-HD-DevOps-Pipeline"
    managed = "terraform"
  }
}

resource "random_password" "mysql" {
  length           = 24
  special          = true
  override_special = "!#%*-_"
}

resource "azurerm_resource_group" "rg" {
  name     = "${local.prefix}-rg"
  location = var.location
  tags     = local.tags
}

#############################################
# Azure Container Registry (build artefact store)
#############################################
resource "azurerm_container_registry" "acr" {
  name                = "${local.prefix}acr"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
  tags                = local.tags
}

#############################################
# Application Insights (App Service monitoring)
#############################################
resource "azurerm_application_insights" "appi" {
  name                = "${local.prefix}-appi"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  application_type    = "Node.JS"
  tags                = local.tags
}

#############################################
# Azure Database for MySQL (Flexible Server)
#############################################
resource "azurerm_mysql_flexible_server" "db" {
  name                   = "${local.prefix}-mysql"
  resource_group_name    = azurerm_resource_group.rg.name
  location               = azurerm_resource_group.rg.location
  administrator_login    = var.mysql_admin_username
  administrator_password = random_password.mysql.result
  sku_name               = "B_Standard_B1ms"
  version                = "8.0.21"
  zone                   = "1"

  storage {
    size_gb = 20
  }

  tags = local.tags
}

resource "azurerm_mysql_flexible_database" "appdb" {
  name                = var.db_name
  resource_group_name = azurerm_resource_group.rg.name
  server_name         = azurerm_mysql_flexible_server.db.name
  charset             = "utf8mb4"
  collation           = "utf8mb4_unicode_ci"
}

# Allow other Azure services (App Service) to reach MySQL.
resource "azurerm_mysql_flexible_server_firewall_rule" "azure_services" {
  name                = "allow-azure-services"
  resource_group_name = azurerm_resource_group.rg.name
  server_name         = azurerm_mysql_flexible_server.db.name
  start_ip_address    = "0.0.0.0"
  end_ip_address      = "0.0.0.0"
}

# Allow your admin IP (and the Jenkins VM via its public IP) for migrations.
resource "azurerm_mysql_flexible_server_firewall_rule" "admin_ip" {
  name                = "allow-admin-ip"
  resource_group_name = azurerm_resource_group.rg.name
  server_name         = azurerm_mysql_flexible_server.db.name
  start_ip_address    = cidrhost(var.allowed_admin_cidr, 0)
  end_ip_address      = cidrhost(var.allowed_admin_cidr, 0)
}

resource "azurerm_mysql_flexible_server_firewall_rule" "jenkins_vm" {
  name                = "allow-jenkins-vm"
  resource_group_name = azurerm_resource_group.rg.name
  server_name         = azurerm_mysql_flexible_server.db.name
  start_ip_address    = azurerm_public_ip.vm.ip_address
  end_ip_address      = azurerm_public_ip.vm.ip_address
}
