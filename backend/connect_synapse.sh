#!/usr/bin/env bash

# Helper script to connect live to the running Matrix Synapse container

echo "=========================================================="
echo "⚡ Connecting live to running Docker Synapse container..."
echo "=========================================================="

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: 'docker' is not installed or not in PATH."
    exit 1
fi

# Check if the synapse container is running
CONTAINER_NAME="matrix_synapse"
if [ ! "$(docker ps -q -f name=${CONTAINER_NAME})" ]; then
    echo "⚠️ Warning: Container '${CONTAINER_NAME}' does not seem to be running."
    echo "Listing all containers:"
    docker ps -a
    echo ""
    echo "Attempting to connect anyway..."
fi

# Connect via interactive bash shell
docker exec -it "${CONTAINER_NAME}" /bin/bash || docker exec -it "${CONTAINER_NAME}" /bin/sh
