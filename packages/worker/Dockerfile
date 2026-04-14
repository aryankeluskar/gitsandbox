FROM docker.io/cloudflare/sandbox:0.7.0

RUN apt-get update && \
    apt-get install -y --no-install-recommends git curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g opencode-ai @mariozechner/pi-coding-agent

WORKDIR /workspace
