FROM docker.io/cloudflare/sandbox:0.7.0

RUN apt-get update && \
    apt-get install -y --no-install-recommends git curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g opencode-ai && \
    npm cache clean --force && \
    rm -rf /tmp/* /root/.npm

EXPOSE 4096

WORKDIR /workspace
