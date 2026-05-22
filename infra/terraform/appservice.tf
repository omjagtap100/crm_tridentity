#############################################
# App Service Plan + Linux Web App (container)
# Production slot + "staging" slot enable:
#   Deploy stage  -> push image to staging slot
#   Release stage -> swap staging into production (zero downtime)
#   Rollback      -> swap back
#############################################
resource "azurerm_service_plan" "plan" {
  name                = "${local.prefix}-plan"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  os_type             = "Linux"
  sku_name            = var.app_service_sku
  tags                = local.tags
}

locals {
  # App settings shared by production + staging slots.
  app_settings = {
    WEBSITES_PORT                         = "3000"
    PORT                                  = "3000"
    NODE_ENV                              = "production"
    DOCKER_ENABLE_CI                      = "true"
    DB_HOST                               = azurerm_mysql_flexible_server.db.fqdn
    DB_PORT                               = "3306"
    DB_NAME                               = var.db_name
    DB_USERNAME                           = "${var.mysql_admin_username}"
    DB_PASSWORD                           = random_password.mysql.result
    JWT_ACCESS_SECRET                     = random_password.jwt_access.result
    JWT_REFRESH_SECRET                    = random_password.jwt_refresh.result
    CORS_ORIGIN                           = "*"
    OTEL_ENABLED                          = "false"
    LOG_FORMAT                            = "json"
    APPLICATIONINSIGHTS_CONNECTION_STRING = azurerm_application_insights.appi.connection_string
  }
}

resource "random_password" "jwt_access" {
  length  = 64
  special = false
}

resource "random_password" "jwt_refresh" {
  length  = 64
  special = false
}

resource "azurerm_linux_web_app" "app" {
  name                = "${local.prefix}-app"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_service_plan.plan.location
  service_plan_id     = azurerm_service_plan.plan.id
  https_only          = true
  tags                = local.tags

  site_config {
    always_on         = true
    health_check_path = "/health"
    ftps_state        = "Disabled"

    application_stack {
      docker_image_name        = "${var.image_name}:latest"
      docker_registry_url      = "https://${azurerm_container_registry.acr.login_server}"
      docker_registry_username = azurerm_container_registry.acr.admin_username
      docker_registry_password = azurerm_container_registry.acr.admin_password
    }
  }

  app_settings = local.app_settings

  lifecycle {
    # Jenkins updates the running image tag per build; don't let TF revert it.
    ignore_changes = [site_config[0].application_stack[0].docker_image_name]
  }
}

resource "azurerm_linux_web_app_slot" "staging" {
  name           = "staging"
  app_service_id = azurerm_linux_web_app.app.id
  https_only     = true
  tags           = local.tags

  site_config {
    always_on         = true
    health_check_path = "/health"
    ftps_state        = "Disabled"

    application_stack {
      docker_image_name        = "${var.image_name}:latest"
      docker_registry_url      = "https://${azurerm_container_registry.acr.login_server}"
      docker_registry_username = azurerm_container_registry.acr.admin_username
      docker_registry_password = azurerm_container_registry.acr.admin_password
    }
  }

  app_settings = local.app_settings

  lifecycle {
    ignore_changes = [site_config[0].application_stack[0].docker_image_name]
  }
}
