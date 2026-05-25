# eCom SaaS Backend — SIT753 7.3HD DevOps Pipeline

Multi-tenant eCommerce SaaS backend (Node.js 20 + Express + Sequelize/MySQL) with a full
**7-stage Jenkins CI/CD pipeline** deploying to **Azure App Service**, plus Jenkins,
SonarQube, Prometheus, Grafana and Alertmanager running on an **Azure VM**. All Azure
infrastructure is **Terraform IaC**.

## Architecture

```
GitHub ──push/webhook──► Jenkins (Azure VM)
                            │ Build → push image
                            ▼
                     Azure Container Registry (tagged images)
                            │
   Deploy ─► App Service "staging" slot ──swap──► Production slot   (rollback = swap back)
                            ▲                          │
                            └── Azure MySQL Flexible Server ◄┘
                                       ▲
   Prometheus (VM) ─scrape /metrics────┘   ──► Grafana dashboards + Alertmanager alerts
```

### The 7 pipeline stages (`Jenkinsfile`)


| #   | Stage        | Tools                           | What it does                                                  |
| --- | ------------ | ------------------------------- | ------------------------------------------------------------- |
| 1   | Build        | Docker, ACR                     | Builds image, tags `BUILD-<gitsha>` + `latest`, pushes to ACR |
| 2   | Test         | Jest, Supertest                 | Unit + integration; JUnit + coverage; hard pass/fail gate     |
| 3   | Code Quality | SonarQube                       | Scan + quality gate (`qualitygate.wait`); aborts on fail      |
| 4   | Security     | Trivy, npm audit                | Image + fs scan; **CRITICAL fails build**, HIGH documented    |
| 5   | Deploy       | App Service slot, az CLI        | Pushes image to staging slot; smoke-tests `/health`           |
| 6   | Release      | Slot swap, git tag              | Zero-downtime swap to prod; **auto-rollback** on smoke fail   |
| 7   | Monitoring   | Prometheus/Grafana/Alertmanager | Confirms live prod target is `up`                             |


---

## ⭐ Renaming the project (do this BEFORE deploying)

Resource names derive from one prefix. Change it in exactly **two places** — both single lines:

1. `infra/terraform/terraform.tfvars` → `project = "yournewname"`
2. `Jenkinsfile` → `PROJECT = 'yournewname'` (the RENAME POINT at the top)

That renames everything: RG `<name>-rg`, ACR `<name>acr`, app `<name>-app`, MySQL `<name>-mysql`, VM `<name>-cicd-vm`, plus the URLs the pipeline smoke-tests.

**Constraints on the name** (because of ACR + App Service global uniqueness):

- lowercase letters + digits only, no hyphens/underscores (it becomes the ACR name `<name>acr`)
- 3–20 chars, and **globally unique** across Azure (e.g. `ecomsaasjd23`)

> SonarQube project key is independent — it's `ecom-saas-backend` in `sonar-project.properties`. Leave it or change it there + create the matching project in SonarQube.

---

## Part A — Tear down existing resources

```bash
# 1. Stop the VM stack (on the VM)
ssh -i ~/.ssh/ecom_devops azureuser@<vm_public_ip>
cd ~/app/infra/vm && docker compose down -v        # -v also wipes Jenkins/Sonar/Grafana volumes
exit

# 2. Destroy all Azure infra (on your Mac)
cd "infra/terraform"
terraform destroy                                  # type 'yes'

# 3. (optional) remove the old Jenkins service principal
az ad sp delete --id <appId-of-ecomsaas-jenkins>
```

`terraform destroy` removes the RG and everything in it (App Service, ACR, MySQL, VM, networking). Verify nothing remains: `az group list -o table`.

---

## Part B — Rebuild from scratch

### 0. Prerequisites (one-time, on your Machine)

```bash
brew install terraform azure-cli
az login
az account show --query id -o tsv          # note SUBSCRIPTION_ID
ssh-keygen -t rsa -b 4096 -f ~/.ssh/ecom_devops -N ""    # if you don't have a key
```

### 1. Provision Azure infra (Terraform)

```bash
cd "infra/terraform"
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
project            = "yournewname"            # see Renaming section
location           = "australiaeast"
app_service_sku    = "S1"                     # Standard — has slots + has quota (NOT B1, NOT P1v2)
vm_ssh_public_key  = "ssh-rsa AAAA..."        # paste: cat ~/.ssh/ecom_devops.pub
allowed_admin_cidr = "YOUR.IP.HERE/32"        # curl -s ifconfig.me  → append /32
```

```bash
terraform init
terraform apply            # ~10-12 min (MySQL + VM are slow). type 'yes'
terraform output           # save: app_name, resource_group, vm_public_ip, mysql_fqdn, urls
terraform output -raw mysql_admin_password
terraform output -raw acr_login_server
```

> **Known gotchas (already handled in code, here's why):**
>
> - SKU is `S1` because student/free subscriptions have **0 PremiumV2 quota**. If `S1` also shows 0 quota, request a bump in *Portal → Subscriptions → Usage + quotas*, or change `location`.
> - App Insights is workspace-based (a Log Analytics workspace is created) — classic AI is retired and can't be unset.

### 2. Service principal for Jenkins (+ required roles)

```bash
SUB=<SUBSCRIPTION_ID>
az ad sp create-for-rbac --name yournewname-jenkins \
  --role Contributor \
  --scopes /subscriptions/$SUB/resourceGroups/yournewname-rg
# SAVE the output: appId (client id), password (client secret), tenant

# Grant push rights to the registry (the Contributor role alone is not enough to push images)
SP=<appId>
az role assignment create --assignee $SP --role AcrPush \
  --scope $(az acr show -n yournewnameacr --query id -o tsv)

# Verify the SP can log in and see the subscription (must NOT say "No subscriptions found")
az login --service-principal -u $SP -p <client-secret> --tenant <tenant>
az account show -o table && az logout
```

> If login says **"No subscriptions found"**, the role assignment didn't take — re-run the `az role assignment create` for Contributor on the RG and wait ~2 min for RBAC to propagate.

### 3. Run DB migrations against Azure MySQL (first deploy only)

```bash
cd "<repo root>"
nvm use 20
npm ci
DB_HOST=<mysql_fqdn> DB_USERNAME=<mysql_admin_username> \
DB_PASSWORD='<mysql_admin_password>' DB_NAME=ecom_saas_db \
NODE_ENV=production npm run migrate
```

### 4. Bring up the CI/CD + monitoring stack (on the VM)

```bash
ssh -i ~/.ssh/ecom_devops azureuser@<vm_public_ip>
git clone https://<gh-user>:<gh-PAT>@github.com/<you>/<repo>.git app   # PAT for private repos
cd app/infra/vm
cp .env.example .env
nano .env                       # set SONAR_DB_PASSWORD + GRAFANA_ADMIN_PASSWORD
docker compose up -d --build    # builds the custom Jenkins image (docker CLI + Node20 + az + Trivy)
docker compose ps               # all Up
```

> **Gotchas:**
>
> - Jenkins base image is pinned to `2.492.3-lts-jdk17` — needed because the latest plugins require Jenkins ≥ 2.492.3.
> - If `permission denied ... docker.sock`: run `newgrp docker` or re-SSH (cloud-init added you to the docker group).
> - If SonarQube restarts: `sudo sysctl -w vm.max_map_count=262144 && docker compose restart sonarqube`.

Tool UIs (open from your admin IP — the NSG only allows that IP):
`http://<vm_public_ip>:8080` Jenkins · `:9000` SonarQube · `:3000` Grafana · `:9090` Prometheus · `:9093` Alertmanager

### 5. Configure Jenkins

1. Unlock: `docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword` → **Install suggested plugins** → create admin user.
2. SonarQube (`:9000`, login `admin`/`admin`, change pw): create project key `**ecom-saas-backend`**; My Account → Security → generate a **token**.
3. **Manage Jenkins → Credentials → System → Global**, add these 5 (IDs must match exactly):

  | Kind              | ID                      | Value                                      |
  | ----------------- | ----------------------- | ------------------------------------------ |
  | Username/password | `azure-sp`              | username = appId, password = client secret |
  | Secret text       | `azure-tenant-id`       | tenant                                     |
  | Secret text       | `azure-subscription-id` | subscription id                            |
  | Secret text       | `sonar-token`           | SonarQube token                            |
  | Username/password | `github-creds`          | GitHub user + PAT (for release tags)       |

4. **New Item → Multibranch Pipeline** → Branch Source = GitHub (`github-creds`, repo URL) → Build config = *by Jenkinsfile*, Script Path `Jenkinsfile` → Save.
5. **GitHub → repo Settings → Webhooks → Add**: Payload URL `http://<vm_public_ip>:8080/github-webhook/`, content type `application/json`, push events. (Full automation.)

### 6. Point Prometheus at the live app (on the VM)

```bash
cd ~/app
./scripts/set-prometheus-target.sh yournewname-app.azurewebsites.net yournewname-app-staging.azurewebsites.net
```

### 7. Run the pipeline

Push to `main` (or **Build Now**). All 7 stages run: Build → Test → Code Quality → Security → Deploy(staging) → Release(prod swap) → Monitoring.

Verify the image landed: `az acr repository show-tags -n yournewnameacr --repository ecom-saas -o table`.

### 8. Demo monitoring / incident simulation

```bash
./scripts/simulate-incident.sh yournewname-rg yournewname-app
# watch Prometheus :9090/alerts → AppInstanceDown fires after ~1m → resolves when app restarts
```

---

## Security note (Trivy CRITICAL gate)

The Security stage fails on CRITICAL vulnerabilities. Two transitive CVEs were fixed via npm
`overrides` in `package.json` (`fast-xml-parser` 4.5.4, `form-data` 2.5.4). If a future scan
finds a CRITICAL with no fix available, document it in a `.trivyignore` with justification
rather than disabling the gate.

## Local development

```bash
nvm use 20          # runtime pinned to Node 20 (package.json "engines")
npm ci
npm test            # jest unit + integration, no DB needed
npm run dev
```

> Tests must run on **Node 20**. Node 22+ hits a Jest-ESM bug ("module is already linked").

## Cost / cleanup

`S1` plan + B1ms MySQL + D2s_v3 VM ≈ a few AUD/day. Run `**terraform destroy`** when done (Part A).