import { Alert, Anchor, Text } from '@mantine/core';
import { IoWarningOutline } from 'react-icons/io5';
import { Link } from 'react-router';
import { GITHUB_REPO_URL } from '@/constants/github';
import { formatExactDate } from '@/utils/timestamps';
import type { Suspension } from './types';

/** Explains a suspension to the suspended user and how to appeal it. */
export default function SuspensionNotice({
  suspension,
}: {
  suspension: Suspension;
}) {
  return (
    <Alert
      color="red"
      variant="light"
      icon={<IoWarningOutline />}
      title={
        suspension.permanent
          ? 'Your account has been banned'
          : 'Your account is suspended'
      }
    >
      <Text size="sm">
        {suspension.permanent
          ? 'You can still browse the site and delete your own publications, but you can no longer publish, edit, vote, or report.'
          : `Until ${formatExactDate(suspension.until ?? 0)} you can still browse the site and delete your own publications, but you can't publish, edit, vote, or report.`}
      </Text>
      {suspension.reason && (
        <Text size="sm" mt={6}>
          Reason: {suspension.reason}
        </Text>
      )}
      <Text size="sm" mt={6}>
        See the{' '}
        <Anchor component={Link} to="/community-guidelines" size="sm">
          Community Guidelines
        </Anchor>
        . To appeal, open an issue on the{' '}
        <Anchor
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noreferrer"
          size="sm"
        >
          project's GitHub repository
        </Anchor>
        .
      </Text>
    </Alert>
  );
}
