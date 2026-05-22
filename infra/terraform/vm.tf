#############################################
# Networking for the Jenkins / Sonar / monitoring VM
#############################################
resource "azurerm_virtual_network" "vnet" {
  name                = "${local.prefix}-vnet"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  address_space       = ["10.30.0.0/16"]
  tags                = local.tags
}

resource "azurerm_subnet" "subnet" {
  name                 = "${local.prefix}-subnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.30.1.0/24"]
}

resource "azurerm_public_ip" "vm" {
  name                = "${local.prefix}-vm-pip"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = local.tags
}

resource "azurerm_network_security_group" "vm" {
  name                = "${local.prefix}-vm-nsg"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  tags                = local.tags

  # SSH + tool UIs restricted to your admin IP only.
  dynamic "security_rule" {
    for_each = {
      "ssh"          = { priority = 100, port = "22" }
      "jenkins"      = { priority = 110, port = "8080" }
      "sonarqube"    = { priority = 120, port = "9000" }
      "grafana"      = { priority = 130, port = "3000" }
      "prometheus"   = { priority = 140, port = "9090" }
      "alertmanager" = { priority = 150, port = "9093" }
    }
    content {
      name                       = security_rule.key
      priority                   = security_rule.value.priority
      direction                  = "Inbound"
      access                     = "Allow"
      protocol                   = "Tcp"
      source_port_range          = "*"
      destination_port_range     = security_rule.value.port
      source_address_prefix      = var.allowed_admin_cidr
      destination_address_prefix = "*"
    }
  }
}

resource "azurerm_network_interface" "vm" {
  name                = "${local.prefix}-vm-nic"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  tags                = local.tags

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.vm.id
  }
}

resource "azurerm_network_interface_security_group_association" "vm" {
  network_interface_id      = azurerm_network_interface.vm.id
  network_security_group_id = azurerm_network_security_group.vm.id
}

resource "azurerm_linux_virtual_machine" "vm" {
  name                = "${local.prefix}-cicd-vm"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  size                = var.vm_size
  admin_username      = var.vm_admin_username
  network_interface_ids = [azurerm_network_interface.vm.id]
  tags                = local.tags

  admin_ssh_key {
    username   = var.vm_admin_username
    public_key = var.vm_ssh_public_key
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
    disk_size_gb         = 64
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  custom_data = base64encode(file("${path.module}/cloud-init.yaml"))
}
