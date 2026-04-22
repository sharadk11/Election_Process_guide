#!/bin/bash
# Deployment script for India Election Guide
# Make sure to run 'gcloud auth login' before executing this script if you haven't already.

PROJECT_ID="promptwars-election-guide"
GEMINI_API_KEY="REDACTED_API_KEY"

echo "Building Docker image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/india-election-guide

echo "Deploying to Cloud Run..."
gcloud run deploy india-election-guide \
  --image gcr.io/$PROJECT_ID/india-election-guide \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="$GEMINI_API_KEY"

echo "Deployment complete!"
