export const GITHUB_REPO_URL =
  'https://github.com/dragon-traveler-wiki/dragon-traveler-wiki';

export const MAX_GITHUB_ISSUE_URL_LENGTH = 8000;

/**
 * Generate an empty issue body template for when JSON is too large to encode in the URL.
 * @param entityType - The type of entity (e.g., 'tier list', 'team', 'character')
 */
export function buildEmptyIssueBody(entityType: string): string {
  return `**JSON too large for URL - Please paste your ${entityType} JSON below:**\n\nClick the "Copy JSON" button, then paste the content inside the code block below:\n\n\`\`\`json\n\n\`\`\`\n`;
}
