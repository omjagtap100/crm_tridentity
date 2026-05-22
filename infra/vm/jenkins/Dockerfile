# Jenkins controller pre-loaded with the tools the pipeline needs:
#   docker CLI (Build), Node 20 (Test), Azure CLI (Deploy/Release), Trivy (Security).
FROM jenkins/jenkins:2.479.1-lts-jdk17

USER root

# Base tooling
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl ca-certificates gnupg lsb-release apt-transport-https unzip git \
    && rm -rf /var/lib/apt/lists/*

# Docker CLI (talks to the host daemon via the mounted socket)
RUN install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc \
    && chmod a+r /etc/apt/keyrings/docker.asc \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list \
    && apt-get update && apt-get install -y --no-install-recommends docker-ce-cli docker-buildx-plugin \
    && rm -rf /var/lib/apt/lists/*

# Node.js 20 (Test stage — matches production runtime)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Azure CLI (Deploy + Release stages)
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Trivy (Security stage — image + filesystem scanning)
RUN curl -fsSL https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor -o /usr/share/keyrings/trivy.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb generic main" > /etc/apt/sources.list.d/trivy.list \
    && apt-get update && apt-get install -y trivy \
    && rm -rf /var/lib/apt/lists/*

# Pre-install useful plugins
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

USER jenkins
