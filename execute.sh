#!/usr/bin/env bash
# Orchestrate Azure + VM deployment for the SIT753 DevOps pipeline.
# Mirrors README.md Part A (teardown) and Part B (rebuild).
#
# Usage:
#   ./execute.sh help
#   ./execute.sh check                    # verify local prerequisites
#   ./execute.sh init-tfvars              # copy terraform.tfvars.example → terraform.tfvars
#   ./execute.sh provision [--yes]        # terraform init + apply
#   ./execute.sh outputs                  # print terraform outputs (URLs, passwords)
#   ./execute.sh sp                       # create Jenkins service principal + AcrPush
#   ./execute.sh migrate                  # run Sequelize migrations against Azure MySQL
#   ./execute.sh vm                       # print VM bootstrap steps (Jenkins/Sonar stack)
#   ./execute.sh vm-up                    # SSH: docker compose up on the VM (needs ~/app cloned)
#   ./execute.sh prometheus               # SSH: set Prometheus scrape targets on the VM
#   ./execute.sh deploy [--yes]           # provision → sp → migrate → print next steps
#   ./execute.sh destroy [--yes]          # VM stack down (if reachable) + terraform destroy
#
# Environment overrides:
#   SSH_KEY=~/.ssh/ecom_devops   SSH_USER=azureuser   TF_AUTO_APPROVE=1 (same as --yes)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="${ROOT}/infra/terraform"
TFVARS="${TF_DIR}/terraform.tfvars"
JENKINSFILE="${ROOT}/Jenkinsfile"
SSH_KEY="${SSH_KEY:-${HOME}/.ssh/ecom_devops}"
SSH_USER="${SSH_USER:-azureuser}"

log()  { printf '\n==> %s\n' "$*"; }
warn() { printf 'WARN: %s\n' "$*" >&2; }
die()  { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

usage() {
  sed -n '3,20p' "$0" | sed 's/^# \?//'
}

# Read a quoted string value from terraform.tfvars (e.g. project = "foo").
read_tfvar() {
  local key="$1"
  [[ -f "$TFVARS" ]] || die "Missing ${TFVARS}. Run: ./execute.sh init-tfvars"
  grep -E "^[[:space:]]*${key}[[:space:]]*=" "$TFVARS" | head -1 \
    | sed -E 's/^[^=]*=[[:space:]]*"([^"]*)".*/\1/'
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

tf_auto_approve() {
  [[ "${TF_AUTO_APPROVE:-}" == "1" ]] && return 0
  [[ "${1:-}" == "--yes" ]] && return 0
  return 1
}

ensure_az_login() {
  az account show >/dev/null 2>&1 \
    || die "Not logged in to Azure. Run: az login"
}

ensure_tfvars() {
  if [[ -f "$TFVARS" ]]; then
    return 0
  fi
  log "terraform.tfvars not found — creating from example"
  cmd_init_tfvars
}

ensure_tf_outputs() {
  [[ -d "${TF_DIR}/.terraform" ]] || die "Terraform not initialized. Run: ./execute.sh provision"
  terraform -chdir="$TF_DIR" output >/dev/null 2>&1 \
    || die "No terraform outputs. Run: ./execute.sh provision"
}

tf_output() {
  terraform -chdir="$TF_DIR" output -raw "$1" 2>/dev/null
}

project_name() {
  read_tfvar project
}

check_jenkinsfile_project() {
  local tf_proj jenkins_proj
  tf_proj="$(project_name)"
  jenkins_proj="$(grep -E "PROJECT[[:space:]]*=" "$JENKINSFILE" | head -1 \
    | sed -E "s/.*PROJECT[[:space:]]*=[[:space:]]*'([^']*)'.*/\1/")"
  if [[ "$tf_proj" != "$jenkins_proj" ]]; then
    warn "project in terraform.tfvars (${tf_proj}) != Jenkinsfile PROJECT (${jenkins_proj})"
    warn "Update both before deploying (see README Renaming section)."
  fi
}

use_node20() {
  if command -v nvm >/dev/null 2>&1; then
    # nvm is a shell function — only works when sourced
    :
  fi
  if [[ -s "${HOME}/.nvm/nvm.sh" ]]; then
    # shellcheck source=/dev/null
    . "${HOME}/.nvm/nvm.sh"
    nvm use 20 >/dev/null 2>&1 || nvm install 20
  fi
  local ver
  ver="$(node -v 2>/dev/null || true)"
  [[ "$ver" == v20* ]] || warn "Node ${ver:-not installed}; tests/migrations expect Node 20 (see README)"
}

cmd_check() {
  log "Checking prerequisites"
  for c in terraform az curl git ssh docker; do
    require_cmd "$c"
  done
  ensure_az_login
  local sub
  sub="$(az account show --query id -o tsv)"
  log "Azure subscription: ${sub}"
  [[ -f "${SSH_KEY}" ]] || warn "SSH private key not found at ${SSH_KEY} (run: ssh-keygen -t rsa -b 4096 -f ${SSH_KEY} -N \"\")"
  [[ -f "${SSH_KEY}.pub" ]] || warn "SSH public key not found at ${SSH_KEY}.pub"
  if command -v node >/dev/null 2>&1; then
    log "Node: $(node -v)"
  else
    warn "node not found — install Node 20 (nvm recommended)"
  fi
  log "Prerequisites OK"
}

cmd_init_tfvars() {
  if [[ -f "$TFVARS" ]]; then
    log "${TFVARS} already exists — edit project, vm_ssh_public_key, allowed_admin_cidr"
    return 0
  fi
  cp "${TF_DIR}/terraform.tfvars.example" "$TFVARS"
  log "Created ${TFVARS}"

  local my_ip
  my_ip="$(curl -fsS --max-time 5 https://ifconfig.me 2>/dev/null \
    || curl -fsS --max-time 5 https://icanhazip.com 2>/dev/null || true)"
  if [[ -n "$my_ip" ]]; then
    if [[ "$(uname -s)" == Darwin ]]; then
      sed -i '' "s|203.0.113.10/32|${my_ip}/32|" "$TFVARS"
    else
      sed -i "s|203.0.113.10/32|${my_ip}/32|" "$TFVARS"
    fi
    log "Set allowed_admin_cidr to ${my_ip}/32"
  fi

  if [[ -f "${SSH_KEY}.pub" ]]; then
    warn "Paste your public key into vm_ssh_public_key:"
    echo "  cat ${SSH_KEY}.pub"
  fi

  warn "Edit ${TFVARS}: set project (3-20 lowercase alphanumeric, globally unique)"
  warn "Then set the same value in Jenkinsfile PROJECT (RENAME POINT)"
}

cmd_provision() {
  ensure_tfvars
  check_jenkinsfile_project
  log "Provisioning Azure infrastructure (terraform apply, ~10-12 min)"
  terraform -chdir="$TF_DIR" init
  if tf_auto_approve "${1:-}"; then
    terraform -chdir="$TF_DIR" apply -auto-approve
  else
    terraform -chdir="$TF_DIR" apply
  fi
  cmd_outputs
}

cmd_outputs() {
  ensure_tf_outputs
  local proj rg vm app staging
  proj="$(project_name)"
  rg="$(tf_output resource_group)"
  vm="$(tf_output vm_public_ip)"
  app="${proj}-app.azurewebsites.net"
  staging="${proj}-app-staging.azurewebsites.net"

  log "Terraform outputs"
  terraform -chdir="$TF_DIR" output
  echo ""
  log "Quick reference"
  printf '  project:            %s\n' "$proj"
  printf '  resource_group:     %s\n' "$rg"
  printf '  vm_public_ip:       %s\n' "$vm"
  printf '  prod hostname:      %s\n' "$app"
  printf '  staging hostname:   %s\n' "$staging"
  printf '  mysql password:     terraform -chdir=%s output -raw mysql_admin_password\n' "$TF_DIR"
  printf '\n  Jenkins:      http://%s:8080\n' "$vm"
  printf '  SonarQube:    http://%s:9000\n' "$vm"
  printf '  Grafana:      http://%s:3000\n' "$vm"
  printf '  Prometheus:   http://%s:9090\n' "$vm"
}

cmd_sp() {
  ensure_tf_outputs
  ensure_az_login
  local proj rg sub sp_json app_id
  proj="$(project_name)"
  rg="$(tf_output resource_group)"
  sub="$(az account show --query id -o tsv)"

  log "Creating service principal ${proj}-jenkins on ${rg}"
  sp_json="$(az ad sp create-for-rbac \
    --name "${proj}-jenkins" \
    --role Contributor \
    --scopes "/subscriptions/${sub}/resourceGroups/${rg}" \
    -o json)"
  app_id="$(echo "$sp_json" | grep -o '"appId": "[^"]*"' | head -1 | cut -d'"' -f4)"

  log "Granting AcrPush on ${proj}acr"
  az role assignment create \
    --assignee "$app_id" \
    --role AcrPush \
    --scope "$(az acr show -n "${proj}acr" --query id -o tsv)"

  echo ""
  log "Service principal created — add these Jenkins credentials (Manage Jenkins → Credentials):"
  echo "$sp_json" | sed 's/^/  /'
  cat <<EOF

  | Kind              | ID                     | Value                          |
  |-------------------|------------------------|--------------------------------|
  | Username/password | azure-sp               | username=appId, password=secret|
  | Secret text       | azure-tenant-id        | tenant from output above       |
  | Secret text       | azure-subscription-id  | ${sub}                         |

  Verify SP login (must NOT say "No subscriptions found"):
    az login --service-principal -u <appId> -p <password> --tenant <tenant>
    az account show -o table && az logout
EOF
}

cmd_migrate() {
  ensure_tf_outputs
  use_node20
  local host user pass db
  host="$(tf_output mysql_fqdn)"
  user="$(tf_output mysql_admin_username)"
  pass="$(tf_output mysql_admin_password)"
  db="$(read_tfvar db_name)"
  [[ -n "$db" ]] || db="ecom_saas_db"

  log "Running DB migrations against ${host}"
  cd "$ROOT"
  npm ci
  DB_HOST="$host" \
  DB_USERNAME="$user" \
  DB_PASSWORD="$pass" \
  DB_NAME="$db" \
  NODE_ENV=production \
  npm run migrate
  log "Migrations complete"
}

ssh_vm() {
  local vm_ip="$1"
  shift
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "${SSH_USER}@${vm_ip}" "$@"
}

cmd_vm() {
  ensure_tf_outputs
  local vm proj
  vm="$(tf_output vm_public_ip)"
  proj="$(project_name)"

  cat <<EOF

VM bootstrap (run once on the CI/CD VM):

  ssh -i ${SSH_KEY} ${SSH_USER}@${vm}

  # Clone the repo (use a GitHub PAT for private repos):
  git clone https://<github-user>:<PAT>@github.com/<org>/<repo>.git app
  cd app/infra/vm
  cp .env.example .env
  # Edit .env: SONAR_DB_PASSWORD, GRAFANA_ADMIN_PASSWORD
  docker compose up -d --build
  docker compose ps

Or from your Mac after the repo is cloned on the VM:
  ./execute.sh vm-up

Jenkins setup (${proj}):
  1. Unlock: docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
  2. SonarQube http://${vm}:9000 — project key ecom-saas-backend, generate token
  3. Add credentials: azure-sp, azure-tenant-id, azure-subscription-id, sonar-token, github-creds
  4. Multibranch Pipeline → Jenkinsfile, GitHub webhook → http://${vm}:8080/github-webhook/
  5. ./execute.sh sp   (if not done yet)
  6. ./execute.sh prometheus   (after VM stack is up)

EOF
}

cmd_vm_up() {
  ensure_tf_outputs
  local vm
  vm="$(tf_output vm_public_ip)"
  log "Starting CI/CD stack on VM ${vm}"
  ssh_vm "$vm" 'test -d ~/app/infra/vm || { echo "~/app not found — clone the repo first (./execute.sh vm)"; exit 1; }
    cd ~/app/infra/vm
    test -f .env || cp .env.example .env
    docker compose up -d --build
    docker compose ps'
}

cmd_prometheus() {
  ensure_tf_outputs
  local vm proj prod staging
  vm="$(tf_output vm_public_ip)"
  proj="$(project_name)"
  prod="${proj}-app.azurewebsites.net"
  staging="${proj}-app-staging.azurewebsites.net"

  log "Setting Prometheus targets: ${prod}, ${staging}"
  ssh_vm "$vm" "cd ~/app && ./scripts/set-prometheus-target.sh ${prod} ${staging}"
}

cmd_deploy() {
  cmd_check
  ensure_tfvars
  check_jenkinsfile_project
  cmd_provision "${1:-}"
  cmd_sp
  cmd_migrate
  cmd_vm
  log "Deploy automation finished. Complete VM + Jenkins steps above, then push to main (or Build Now)."
}

cmd_destroy() {
  ensure_az_login
  local vm=""
  if [[ -f "$TFVARS" ]] && terraform -chdir="$TF_DIR" output vm_public_ip >/dev/null 2>&1; then
    vm="$(tf_output vm_public_ip 2>/dev/null || true)"
  fi

  if [[ -n "$vm" ]] && [[ -f "${SSH_KEY}" ]]; then
    log "Stopping VM Docker stack at ${vm}"
    ssh_vm "$vm" 'cd ~/app/infra/vm 2>/dev/null && docker compose down -v || true' \
      || warn "Could not reach VM — continuing with terraform destroy"
  fi

  log "Destroying Azure infrastructure"
  terraform -chdir="$TF_DIR" init -input=false
  if tf_auto_approve "${1:-}"; then
    terraform -chdir="$TF_DIR" destroy -auto-approve
  else
    terraform -chdir="$TF_DIR" destroy
  fi
  log "Destroy complete. Verify: az group list -o table"
  warn "Optional: az ad sp delete --id <appId-of-${proj:-project}-jenkins>"
}

main() {
  local cmd="${1:-help}"
  shift || true
  case "$cmd" in
    help|-h|--help) usage ;;
    check)          cmd_check ;;
    init-tfvars)    cmd_init_tfvars ;;
    provision|terraform) cmd_provision "$@" ;;
    outputs)        cmd_outputs ;;
    sp|service-principal) cmd_sp ;;
    migrate)        cmd_migrate ;;
    vm)             cmd_vm ;;
    vm-up)          cmd_vm_up ;;
    prometheus|prom) cmd_prometheus ;;
    deploy)         cmd_deploy "$@" ;;
    destroy|teardown) cmd_destroy "$@" ;;
    *)
      die "Unknown command: ${cmd}. Run: ./execute.sh help"
      ;;
  esac
}

main "$@"
