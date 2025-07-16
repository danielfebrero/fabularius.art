import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const isLocal =
  process.env["AWS_SAM_LOCAL"] === "true" ||
  process.env["NODE_ENV"] === "development";

let ssmClient: SSMClient;
if (!isLocal) {
  ssmClient = new SSMClient({
    region: process.env["AWS_REGION"] || "us-east-1",
  });
}

// Cache for parameters to avoid repeated API calls
const parameterCache = new Map<string, string>();

export class ParameterStoreService {
  /**
   * Get a parameter from AWS Systems Manager Parameter Store
   * @param parameterName The name of the parameter
   * @param decrypt Whether to decrypt the parameter if it's a SecureString
   * @returns The parameter value
   */
  static async getParameter(
    parameterName: string,
    decrypt: boolean = true
  ): Promise<string> {
    // Check cache first
    const cacheKey = `${parameterName}_${decrypt}`;
    if (parameterCache.has(cacheKey)) {
      return parameterCache.get(cacheKey)!;
    }

    try {
      let processedParameterName = parameterName;
      if (
        parameterName.startsWith("/prod") ||
        parameterName.startsWith("/staging") ||
        parameterName.startsWith("/dev")
      ) {
        processedParameterName = `/pornspot-ai${parameterName}`;
      }
      const command = new GetParameterCommand({
        Name: processedParameterName,
        WithDecryption: decrypt,
      });

      const response = await ssmClient.send(command);

      if (!response.Parameter?.Value) {
        throw new Error(
          `Parameter ${processedParameterName} not found or has no value`
        );
      }

      const value = response.Parameter.Value;

      // Cache the value for this Lambda execution
      parameterCache.set(cacheKey, value);

      return value;
    } catch (error) {
      console.error(`Error fetching parameter ${parameterName}:`, error);
      throw new Error(`Failed to fetch parameter ${parameterName}: ${error}`);
    }
  }

  /**
   * Get the revalidation secret from Parameter Store or environment variable
   */
  static async getRevalidateSecret(): Promise<string> {
    // In local development, use environment variable directly
    if (isLocal) {
      const secret = process.env["REVALIDATE_SECRET"];
      if (!secret) {
        throw new Error(
          "REVALIDATE_SECRET environment variable is required in local development"
        );
      }
      console.log("Using local REVALIDATE_SECRET from environment variable");
      return secret;
    }

    // In production, use Parameter Store
    const environment = process.env["ENVIRONMENT"] || "dev";
    return await this.getParameter(`/${environment}/revalidate-secret`, true);
  }

  /**
   * Get the frontend URL from Parameter Store or environment variable
   */
  static async getFrontendUrl(): Promise<string> {
    // In local development, use environment variable directly
    if (isLocal) {
      const url = process.env["FRONTEND_URL"];
      if (!url) {
        throw new Error(
          "FRONTEND_URL environment variable is required in local development"
        );
      }
      console.log("Using local FRONTEND_URL from environment variable:", url);
      return url;
    }

    // In production, use Parameter Store
    const environment = process.env["ENVIRONMENT"] || "dev";
    return await this.getParameter(`/${environment}/frontend-url`, false);
  }

  /**
   * Get the Google Client Secret from Parameter Store or environment variable
   */
  static async getGoogleClientSecret(): Promise<string> {
    // In local development, use environment variable directly
    if (isLocal) {
      const secret = process.env["GOOGLE_CLIENT_SECRET"];
      if (!secret) {
        throw new Error(
          "GOOGLE_CLIENT_SECRET environment variable is required in local development"
        );
      }
      console.log("Using local GOOGLE_CLIENT_SECRET from environment variable");
      return secret;
    }

    // In production, use Parameter Store
    const environment = process.env["ENVIRONMENT"] || "dev";
    return await this.getParameter(
      `/${environment}/google-client-secret`,
      true
    );
  }
}
