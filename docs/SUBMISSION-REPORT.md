# SIT753 7.3HD — Submission Report

> Fill in the bracketed fields and export to PDF using the provided template.

## Links
- **Demo video (≤10 min):** [paste link]
- **GitHub repository:** [paste link] — access granted to Marker + Unit Chair
- **Live production app:** https://[app-name].azurewebsites.net

## Stages implemented
**7 / 7** — Build, Test, Code Quality, Security, Deploy, Release, Monitoring (targeting Top HD).

## Project description
A production-like **multi-tenant eCommerce SaaS backend**. Each tenant has isolated
data (tenants, domains, users, products, categories, carts, files, theme settings) with
JWT auth, role-based access, rate limiting, CRUD APIs across auth/store/CRM/admin modules,
background cron jobs, Swagger docs, and Prometheus metrics.

**Tech stack:** Node.js 20, Express, Sequelize, MySQL 8 (Azure Database for MySQL Flexible
Server), Docker, Jest + Supertest, prom-client, Application Insights / OpenTelemetry.

## Infrastructure
- **Azure App Service** (Linux container) with a **staging slot** and production slot.
- **Azure Container Registry** for tagged image artefacts.
- **Azure VM** (Ubuntu) running Jenkins, SonarQube, Prometheus, Grafana, Alertmanager (Docker Compose).
- All Azure resources defined as **Terraform IaC** (`infra/terraform`).

## Pipeline stages

| # | Stage | Tools / Frameworks | What it does |
|---|---|---|---|
| 1 | Build | Docker, Azure CR | Builds image, tags `BUILD-<gitsha>` + `latest`, pushes to ACR |
| 2 | Test | Jest, Supertest, jest-junit | Unit + integration tests; JUnit + coverage; hard pass/fail gate |
| 3 | Code Quality | SonarQube | Scan + quality gate (`qualitygate.wait`), exclusions, coverage import |
| 4 | Security | Trivy, npm audit | Image + filesystem scan; CRITICAL fails build, HIGH documented |
| 5 | Deploy | Azure App Service slot, az CLI | Deploys image to staging slot; smoke-tests `/health` |
| 6 | Release | App Service slot swap, git tag | Zero-downtime swap to prod; auto-rollback on failure; versioned tag |
| 7 | Monitoring | Prometheus, Grafana, Alertmanager | Live metrics, dashboards, alert rules + incident simulation |

## Security findings
| Issue | Severity | Action |
|---|---|---|
| [e.g. CVE-XXXX in lib] | [High/Critical] | [updated to vX.Y / excluded false positive / documented] |

## Screenshots to include
- Jenkins pipeline (all 7 stages green / stage view)
- SonarQube quality gate passed
- Trivy / security report
- App Service slots (staging + production)
- Grafana dashboard with live metrics
- Alertmanager alert firing during incident simulation
