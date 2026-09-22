import { Button } from '@mantine/core';
import { IoBugOutline } from 'react-icons/io5';
import { useGradientAccent } from '@/hooks';
import { buildIssueUrl } from '@/utils/github-issues';

export default function DataCorrectionButton({
  entityType,
}: {
  entityType: string;
}) {
  const { accent } = useGradientAccent();
  const report = () => {
    const pageUrl = window.location.href;
    const issueUrl = buildIssueUrl({
      title: `[Data] Incorrect ${entityType} data`,
      labels: 'data-correction',
      body: `**Page:** ${pageUrl}\n\n**What is incorrect?**\n\n\n**What should it be?**\n\n`,
    });
    window.open(issueUrl, '_blank', 'noopener,noreferrer');
  };
  return (
    <Button
      variant="light"
      color={accent.primary}
      size="sm"
      leftSection={<IoBugOutline size={16} />}
      onClick={report}
    >
      Report issue
    </Button>
  );
}
