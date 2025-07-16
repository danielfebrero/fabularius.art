# Environment Configuration

This document provides a detailed overview of the environment variables used in the PornSpot.ai application.

## New Architecture Overview

The project now uses a modular approach to environment configuration, separating variables by their domain: `frontend`, `backend`, and `scripts`. This improves security and clarity.

---

## 1. Frontend (`frontend/`)

The frontend configuration is managed via `.env` files within the `/frontend` directory.

- **`frontend/.env.example`**: A template file that should be committed to Git. It lists all the necessary anvironment variables for the frontend.
- **`frontend/.env.local`**: This is your local configuration file. It is **not** committed to Git. Copy the example file to create it.

### Frontend Variables

- **`NEXT_PUBLIC_API_URL`**: The base URL of the backend API.
- **`NEXT_PUBLIC_SITE_URL`**: The canonical URL of the site.
- **`NEXT_PUBLIC_CDN_URL`**: The base URL of the CDN for serving media files.
- **`NEXT_PUBLIC_GOOGLE_CLIENT_ID`**: The public client ID for your Google OAuth application.
- **`REVALIDATE_SECRET`**: A secret token used for on-demand revalidation of Next.js pages.

---

## 2. Backend (`backend/`)

The backend uses JSON files for its environment configuration, which is compatible with AWS SAM CLI.

- **`backend/.env.example.json`**: A JSON template showing the structure needed for backend environment variables.
- **`backend/.env.local.json`**: Your local configuration file, which is ignored by Git.

### Backend Parameters

- **`DYNAMODB_TABLE`**: The name of the DynamoDB table.
- **`S3_BUCKET`**: The name of the S3 bucket for media storage.
- **`CLOUDFRONT_DOMAIN`**: The domain of the CloudFront distribution.
- **`AWS_REGION`**: The default AWS region (e.g., `us-east-1`).
- **`LOCAL_AWS_ENDPOINT`**: The endpoint for the local LocalStack container (e.g., `http://localhost:4566`).
- **`GOOGLE_CLIENT_ID`**: The Google OAuth client ID (used for server-side validation).
- **`GOOGLE_CLIENT_SECRET`**: The Google OAuth client secret.
- **`REVALIDATE_SECRET`**: The same revalidation secret used by the frontend.
- **`FRONTEND_URL`**: The URL of the frontend application for redirects.
- **`FROM_EMAIL`** and **`FROM_NAME`**: For sending emails.

---

## 3. Scripts (`scripts/`)

The scripts directory has its own set of environment files, one for each stage of deployment.

- **`scripts/.env.example`**: A template for the script environment files.
- **`scripts/.env.local`**: For running scripts against your local environment.
- **`scripts/.env.development`**: For the development environment.
- **`scripts/.env.staging`**: For the staging environment.
- **`scripts/.env.production`**: For the production environment.

### Script Variables

- **`AWS_ACCESS_KEY_ID`**, **`AWS_SECRET_ACCESS_KEY`**, **`AWS_REGION`**: AWS credentials for the scripts to run.
- **`LOCAL_AWS_ENDPOINT`**: The LocalStack endpoint for `.env.local`.
- **`DYNAMODB_TABLE`**, **`S3_BUCKET`**, **`CLOUDFRONT_DOMAIN`**: AWS resource names, which will differ for each environment file.
