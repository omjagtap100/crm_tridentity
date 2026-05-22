# eCom SaaS Backend — SIT753 7.3HD DevOps Pipeline

Multi-tenant eCommerce SaaS backend (Node.js + Express + Sequelize/MySQL) with a full
7-stage Jenkins CI/CD pipeline deploying to **Azure App Service**, with Jenkins, SonarQube,
Prometheus, Grafana and Alertmanager running on an **Azure VM**.

## Architecture

```
GitHub  ──webhook──►  Jenkins (Azure VM)
                         │  Build → push image
                         ▼
                    Azure Container Registry (tagged images)
                         │
        Deploy ──► App Service "staging" slot ──swap──► Production slot   (rollback = swap back)
                         ▲                                   │
                         └── Azure MySQL Flexible Server ◄────┘
                                     ▲
   Prometheus (VM) ─scrape /metrics──┘   ──► Grafana dashboards + Alertmanager alerts
```

| Concern | Tool |
|---|---|
| Build artefact | Docker image in Azure Container Registry (tagged `BUILD-<gitsha>` + `latest`) |
| Test | Jest + Supertest (unit + integration), JUnit + coverage |
| Code Quality | SonarQube + quality gate (`sonar.qualitygate.wait=true`) |
| Security | Trivy (image + filesystem) + `npm audit` |
| Deploy | App Service **staging slot** |
| Release | **Slot swap** staging→production (zero downtime), git release tag, auto-rollback |
| Monitoring | Prometheus + Grafana + Alertmanager (+ App Insights) |

## The 7 pipeline stages (`Jenkinsfile`)

1. **Build** — `docker build`, tag, `az acr login`, push to ACR.
2. **Test** — `npm ci && npm test` (Node 20), publishes `coverage/junit.xml` + HTML coverage. Hard gate.
3. **Code Quality** — `@sonar/scan` against SonarQube; pipeline aborts if the quality gate fails.
4. **Security** — Trivy fs + image scan; fails on CRITICAL, documents HIGH; `npm audit` report archived.
5. **Deploy (staging)** — sets the staging slot to the new image, restarts, smoke-tests `/health`.
6. **Release (production)** — swaps staging→production, smoke-tests prod, **rolls back by swapping back** on failure, tags the release in git.
7. **Monitoring** — queries Prometheus to confirm the live production target is `up`.

---

## Setup

### 0. Prerequisites
- Azure subscription + `az` CLI (`az login`)
- Terraform ≥ 1.5
- An SSH key: `ssh-keygen -t rsa -b 4096 -f ~/.ssh/ecom_devops`
- A GitHub repo with this code pushed

### 1. Provision Azure infra (IaC)
```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: vm_ssh_public_key, allowed_admin_cidr (curl -s ifconfig.me), region
terraform init
terraform apply
terraform output            # note acr_login_server, app_name, vm_public_ip, urls
terraform output -raw acr_admin_password   # sensitive values
```
This creates: resource group, ACR, App Service plan + web app + **staging slot**, MySQL Flexible
Server + database, Application Insights, and the Ubuntu CI/CD VM (Docker pre-installed).

### 2. Create an Azure service principal for Jenkins
```bash
az ad sp create-for-rbac --name ecomsaas-jenkins \
  --role Contributor \
  --scopes /subscriptions/<SUB_ID>/resourceGroups/ecomsaas-rg
# note appId (client id), password (client secret), tenant
```

### 3. Bring up the CI/CD + monitoring stack on the VM
```bash
ssh azureuser@<vm_public_ip>
git clone <your-repo> app && cd app/infra/vm
cp .env.example .env        # set SONAR_DB_PASSWORD, GRAFANA_ADMIN_PASSWORD
docker compose up -d --build
# Jenkins 8080, SonarQube 9000, Grafana 3000, Prometheus 9090, Alertmanager 9093
```
Point Prometheus at the live app (from the repo root on the VM):
```bash
./scripts/set-prometheus-target.sh <app>.azurewebsites.net <app>-staging.azurewebsites.net
```

### 4. Configure Jenkins
- Unlock with `docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword`.
- **Credentials** (Manage Jenkins → Credentials):
  - `azure-sp` — *Username/password*: client id / client secret
  - `azure-tenant-id` — *Secret text*
  - `azure-subscription-id` — *Secret text*
  - `sonar-token` — *Secret text* (SonarQube → My Account → Tokens)
  - `github-creds` — *Username/password*: GitHub user / PAT (for release tags)
- Create a **Multibranch Pipeline** (or Pipeline) pointing at the GitHub repo; script path `Jenkinsfile`.
- Add a GitHub webhook → `http://<vm_public_ip>:8080/github-webhook/` for full automation.
- Edit the `environment {}` block at the top of `Jenkinsfile` to match your terraform outputs
  (`ACR_NAME`, `ACR_LOGIN_SERVER`, `RESOURCE_GROUP`, `APP_NAME`).

### 5. Run migrations against Azure MySQL (first deploy)
```bash
DB_HOST=<mysql_fqdn> DB_USERNAME=<admin> DB_PASSWORD=<pw> DB_NAME=ecom_saas_db \
NODE_ENV=production npm run migrate
```

### 6. Demo the monitoring/incident flow
```bash
./scripts/simulate-incident.sh ecomsaas-rg ecomsaas-app
# watch Prometheus /alerts → AppInstanceDown fires → resolves when app restarts
```

## Local development
```bash
nvm use 20          # runtime is pinned to Node 20 (see package.json engines)
npm ci
npm test            # jest unit + integration (no DB needed)
npm run dev
```
> Tests run on Node 20 (production runtime). Node 22+ hits a Jest-ESM bug ("module is already linked").
