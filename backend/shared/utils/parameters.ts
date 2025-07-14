import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const ssmClient = new SSMClient({
  region: process.env["AWS_REGION"] || "us-east-1",
});

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
      const command = new GetParameterCommand({
        Name: parameterName,
        WithDecryption: decrypt,
      });

      const response = await ssmClient.send(command);

      if (!response.Parameter?.Value) {
        throw new Error(`Parameter ${parameterName} not found or has no value`);
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
   * Get the revalidation secret from Parameter Store
   */
  static async getRevalidateSecret(): Promise<string> {
    const environment = process.env["ENVIRONMENT"] || "dev";
    return await this.getParameter(`/${environment}/revalidate-secret`, true);
  }

  /**
   * Get the frontend URL from Parameter Store
   */
  static async getFrontendUrl(): Promise<string> {
    const environment = process.env["ENVIRONMENT"] || "dev";
    return await this.getParameter(`/${environment}/frontend-url`, false);
  }
}
