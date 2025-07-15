# Environment Configuration

This document provides a detailed overview of the environment variables used in the PornSpot.ai application.

## Backend Environment Variables

These variables are used by the AWS Lambda functions.

- **`DYNAMODB_TABLE`**: The name of the DynamoDB table used by the application.
- **`S3_BUCKET`**: The name of the S3 bucket used for storing media files.
- **`CLOUDFRONT_DOMAIN`**: The domain name of the CloudFront distribution used for serving media files.

## Frontend Environment Variables

These variables are used by the Next.js frontend. They should be prefixed with `NEXT_PUBLIC_` to be exposed to the browser.

- **`NEXT_PUBLIC_API_URL`**: The base URL of the backend API.
- **`NEXT_PUBLIC_CDN_URL`**: The base URL of the CDN for serving media files.
- **`NEXT_PUBLIC_SITE_URL`**: The canonical URL of the site.

## Google OAuth Environment Variables

These variables are required for the Google OAuth integration.

- **`GOOGLE_CLIENT_ID`**: The client ID for your Google OAuth application.
- **`GOOGLE_CLIENT_SECRET`**: The client secret for your Google OAuth application. This should be stored securely (e.g., in AWS Parameter Store).

## Local Development Environment Variables

These variables are used for local development and are typically defined in a `.env` file, which should not be committed to source control.

- **`NODE_ENV`**: Set to `development` for local development.
- **`LOCAL_AWS_ENDPOINT`**: The endpoint for the local LocalStack container (e.g., `http://localhost:4566`).
- **`LOCAL_S3_BUCKET`**: The name of the S3 bucket to be used in the local environment.
- **`REVALIDATE_SECRET`**: A secret token used for on-demand revalidation of Next.js pages.
- **`FRONTEND_URL`**: The URL of the local frontend application (e.g., `http://localhost:3000`).

## `.env.example`

The project includes a [`.env.example`](../.env.example) file that serves as a template for the required environment variables. To set up your local environment, you should create a `.env` file in the root of the project and populate it with the appropriate values.
