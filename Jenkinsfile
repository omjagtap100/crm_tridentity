// SIT753 7.3HD — DevOps pipeline for the multi-tenant eCommerce SaaS backend.
// 7 stages: Build, Test, Code Quality, Security, Deploy (staging), Release (prod swap), Monitoring.
pipeline {
    agent any

    options {
        timestamps()
        ansiColor('xterm')
        disableConcurrentBuilds()
        timeout(time: 40, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    environment {
        // --- edit these to match your terraform outputs ---
        ACR_NAME        = 'ecomsaasacr'
        ACR_LOGIN_SERVER = 'ecomsaasacr.azurecr.io'
        RESOURCE_GROUP  = 'ecomsaas-rg'
        APP_NAME        = 'ecomsaas-app'
        IMAGE_NAME      = 'ecom-saas'
        STAGING_SLOT    = 'staging'
        SONAR_HOST_URL  = 'http://sonarqube:9000'
        PROM_URL        = 'http://prometheus:9090'
        // --- derived ---
        PROD_URL        = "https://${APP_NAME}.azurewebsites.net"
        STAGING_URL     = "https://${APP_NAME}-${STAGING_SLOT}.azurewebsites.net"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_SHA = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
                    env.IMAGE_TAG = "${BUILD_NUMBER}-${env.GIT_SHA}"
                    env.IMAGE_REF = "${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${env.IMAGE_TAG}"
                    env.IMAGE_LATEST = "${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest"
                    echo "Building image ${env.IMAGE_REF}"
                }
            }
        }

        // 4. BUILD — build a tagged Docker image artefact, push to ACR.
        stage('Build') {
            steps {
                sh 'docker build -t $IMAGE_REF -t $IMAGE_LATEST .'
                withCredentials([
                    usernamePassword(credentialsId: 'azure-sp', usernameVariable: 'AZ_CLIENT_ID', passwordVariable: 'AZ_CLIENT_SECRET'),
                    string(credentialsId: 'azure-tenant-id', variable: 'AZ_TENANT'),
                    string(credentialsId: 'azure-subscription-id', variable: 'AZ_SUB')
                ]) {
                    sh '''
                        az login --service-principal -u "$AZ_CLIENT_ID" -p "$AZ_CLIENT_SECRET" --tenant "$AZ_TENANT" >/dev/null
                        az account set --subscription "$AZ_SUB"
                        az acr login --name "$ACR_NAME"
                        docker push "$IMAGE_REF"
                        docker push "$IMAGE_LATEST"
                    '''
                }
            }
        }

        // 5. TEST — unit + integration (jest/supertest), JUnit + coverage, hard gate.
        stage('Test') {
            steps {
                sh 'npm ci'
                sh 'npm test'
            }
            post {
                always {
                    junit testResults: 'coverage/junit.xml', allowEmptyResults: false
                    publishHTML(target: [
                        reportDir: 'coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report',
                        keepAll: true, alwaysLinkToLastBuild: true, allowMissing: true
                    ])
                }
            }
        }

        // 6. CODE QUALITY — SonarQube scan + quality gate (aborts pipeline on failure).
        stage('Code Quality') {
            steps {
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh '''
                        npx --yes @sonar/scan \
                          -Dsonar.host.url=$SONAR_HOST_URL \
                          -Dsonar.token=$SONAR_TOKEN \
                          -Dsonar.projectVersion=$IMAGE_TAG \
                          -Dsonar.qualitygate.wait=true \
                          -Dsonar.qualitygate.timeout=300
                    '''
                }
            }
        }

        // 7. SECURITY — Trivy (image + filesystem) + npm audit. CRITICAL fails; HIGH documented.
        stage('Security') {
            steps {
                sh '''
                    mkdir -p reports
                    trivy --version
                    # Filesystem / dependency scan (report only)
                    trivy fs --scanners vuln,secret,misconfig --severity HIGH,CRITICAL \
                      --no-progress --format table . | tee reports/trivy-fs.txt
                    # Container image scan — gate on CRITICAL, document HIGH
                    trivy image --severity HIGH,CRITICAL --no-progress --format table \
                      "$IMAGE_REF" | tee reports/trivy-image.txt
                    trivy image --severity CRITICAL --exit-code 1 --no-progress "$IMAGE_REF"
                    # Dependency audit
                    npm audit --omit=dev --audit-level=critical || true
                    npm audit --json > reports/npm-audit.json || true
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'reports/*', allowEmptyArchive: true
                }
            }
        }

        // 8. DEPLOY — push image to the App Service STAGING slot + smoke test.
        stage('Deploy (staging)') {
            steps {
                withCredentials([
                    usernamePassword(credentialsId: 'azure-sp', usernameVariable: 'AZ_CLIENT_ID', passwordVariable: 'AZ_CLIENT_SECRET'),
                    string(credentialsId: 'azure-tenant-id', variable: 'AZ_TENANT'),
                    string(credentialsId: 'azure-subscription-id', variable: 'AZ_SUB')
                ]) {
                    sh '''
                        az login --service-principal -u "$AZ_CLIENT_ID" -p "$AZ_CLIENT_SECRET" --tenant "$AZ_TENANT" >/dev/null
                        az account set --subscription "$AZ_SUB"
                        az webapp config container set \
                          --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --slot "$STAGING_SLOT" \
                          --container-image-name "$IMAGE_REF" \
                          --container-registry-url "https://$ACR_LOGIN_SERVER"
                        az webapp restart --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --slot "$STAGING_SLOT"
                    '''
                }
                sh './scripts/smoke-test.sh "$STAGING_URL"'
            }
        }

        // 9. RELEASE — swap staging into production (zero-downtime). Rollback on smoke failure.
        stage('Release (production)') {
            steps {
                withCredentials([
                    usernamePassword(credentialsId: 'azure-sp', usernameVariable: 'AZ_CLIENT_ID', passwordVariable: 'AZ_CLIENT_SECRET'),
                    string(credentialsId: 'azure-tenant-id', variable: 'AZ_TENANT'),
                    string(credentialsId: 'azure-subscription-id', variable: 'AZ_SUB')
                ]) {
                    sh '''
                        az login --service-principal -u "$AZ_CLIENT_ID" -p "$AZ_CLIENT_SECRET" --tenant "$AZ_TENANT" >/dev/null
                        az account set --subscription "$AZ_SUB"
                        az webapp deployment slot swap \
                          --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" \
                          --slot "$STAGING_SLOT" --target-slot production
                    '''
                    script {
                        def ok = sh(returnStatus: true, script: './scripts/smoke-test.sh "$PROD_URL"')
                        if (ok != 0) {
                            echo 'Production smoke test FAILED — rolling back via slot swap.'
                            sh '''
                                az webapp deployment slot swap \
                                  --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" \
                                  --slot "$STAGING_SLOT" --target-slot production
                            '''
                            error 'Release rolled back: production smoke test failed.'
                        }
                    }
                }
                // Tag the release in git (best-effort).
                withCredentials([usernamePassword(credentialsId: 'github-creds', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PAT')]) {
                    sh '''
                        VERSION="v1.0.$BUILD_NUMBER"
                        git config user.email "ci@jenkins"
                        git config user.name "jenkins-ci"
                        git tag -a "$VERSION" -m "Release $VERSION ($IMAGE_TAG)" || true
                        ORIGIN=$(git config --get remote.origin.url | sed -E "s#https://#https://$GIT_USER:$GIT_PAT@#")
                        git push "$ORIGIN" "$VERSION" || true
                    '''
                }
            }
        }

        // 10. MONITORING — confirm Prometheus is scraping the live production target.
        stage('Monitoring') {
            steps {
                sh '''
                    echo "Querying Prometheus for production target health..."
                    for i in $(seq 1 10); do
                      UP=$(curl -s "$PROM_URL/api/v1/query?query=up%7Bjob%3D%22ecom-app%22%7D" \
                           | grep -o '"value":\\[[^]]*\\]' | grep -o '1"' | head -1 || true)
                      if [ "$UP" = "1\\"" ]; then echo "Prometheus target ecom-app is UP."; exit 0; fi
                      echo "  attempt $i: target not up yet, retrying..."; sleep 10
                    done
                    echo "WARN: Prometheus did not report target up (check prometheus.yml __APP_HOSTNAME__)."
                '''
            }
        }
    }

    post {
        success {
            echo "Pipeline SUCCESS — released ${env.IMAGE_REF} to ${env.PROD_URL}"
        }
        failure {
            echo "Pipeline FAILED at stage. Check logs above."
        }
        always {
            cleanWs(notFailBuild: true)
        }
    }
}
