import fs from "fs/promises";
import path from "path";

export interface TemplateVariables {
  [key: string]: string;
}

export class EmailTemplateService {
  private static readonly TEMPLATES_DIR = path.join(
    __dirname,
    "../email_templates"
  );

  /**
   * Load and process an email template
   */
  static async loadTemplate(
    templateName: string,
    variables: TemplateVariables
  ): Promise<{ htmlBody: string; textBody: string }> {
    try {
      // Load HTML template
      const htmlPath = path.join(this.TEMPLATES_DIR, `${templateName}.html`);
      const htmlTemplate = await fs.readFile(htmlPath, "utf-8");
      const htmlBody = this.processTemplate(htmlTemplate, variables);

      // Load text template
      const textPath = path.join(this.TEMPLATES_DIR, `${templateName}.txt`);
      const textTemplate = await fs.readFile(textPath, "utf-8");
      const textBody = this.processTemplate(textTemplate, variables);

      return { htmlBody, textBody };
    } catch (error) {
      console.error(`Failed to load template ${templateName}:`, error);
      throw new Error(
        `Template ${templateName} not found or could not be loaded`
      );
    }
  }

  /**
   * Process template by replacing variables
   */
  private static processTemplate(
    template: string,
    variables: TemplateVariables
  ): string {
    let processed = template;

    // Replace all variables in the format {{variableName}}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      processed = processed.replace(regex, value);
    }

    return processed;
  }

  /**
   * Get available templates
   */
  static async getAvailableTemplates(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.TEMPLATES_DIR);
      const templates = files
        .filter((file) => file.endsWith(".html"))
        .map((file) => file.replace(".html", ""));

      return templates;
    } catch (error) {
      console.error("Failed to get available templates:", error);
      return [];
    }
  }

  /**
   * Validate that both HTML and text templates exist for a given template name
   */
  static async validateTemplate(templateName: string): Promise<boolean> {
    try {
      const htmlPath = path.join(this.TEMPLATES_DIR, `${templateName}.html`);
      const textPath = path.join(this.TEMPLATES_DIR, `${templateName}.txt`);

      await fs.access(htmlPath);
      await fs.access(textPath);

      return true;
    } catch {
      return false;
    }
  }
}
