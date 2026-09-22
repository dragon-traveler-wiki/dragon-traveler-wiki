import { GITHUB_REPO_URL } from '@/constants/github';

export function buildExpiredCodeUrl(code: string): string {
  const params = new URLSearchParams({
    title: `[Code] Report expired: ${code}`,
    body: `The code \`${code}\` appears to be expired or no longer working.\n`,
    labels: 'codes',
  });
  return `${GITHUB_REPO_URL}/issues/new?${params.toString()}`;
}

interface BuildIssueUrlOptions {
  title: string;
  body: string;
  labels?: string;
}

export function buildIssueUrl({
  title,
  body,
  labels,
}: BuildIssueUrlOptions): string {
  const params = new URLSearchParams({
    title,
    body,
    ...(labels ? { labels } : {}),
  });
  return `${GITHUB_REPO_URL}/issues/new?${params.toString()}`;
}
