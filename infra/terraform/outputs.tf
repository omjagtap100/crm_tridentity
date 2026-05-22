output "acr_login_server" {
  value = azurerm_container_registry.acr.login_server
}

output "acr_admin_username" {
  value     = azurerm_container_registry.acr.admin_username
  sensitive = true
}

output "acr_admin_password" {
  value     = azurerm_container_registry.acr.admin_password
  sensitive = true
}

output "app_name" {
  value = azurerm_linux_web_app.app.name
}

output "app_default_hostname" {
  value = "https://${azurerm_linux_web_app.app.default_hostname}"
}

output "staging_hostname" {
  value = "https://${azurerm_linux_web_app_slot.staging.default_hostname}"
}

output "resource_group" {
  value = azurerm_resource_group.rg.name
}

output "mysql_fqdn" {
  value = azurerm_mysql_flexible_server.db.fqdn
}

output "mysql_admin_username" {
  value = var.mysql_admin_username
}

output "mysql_admin_password" {
  value     = random_password.mysql.result
  sensitive = true
}

output "vm_public_ip" {
  value = azurerm_public_ip.vm.ip_address
}

output "jenkins_url" {
  value = "http://${azurerm_public_ip.vm.ip_address}:8080"
}

output "sonarqube_url" {
  value = "http://${azurerm_public_ip.vm.ip_address}:9000"
}

output "grafana_url" {
  value = "http://${azurerm_public_ip.vm.ip_address}:3000"
}

output "prometheus_url" {
  value = "http://${azurerm_public_ip.vm.ip_address}:9090"
}
