import { Container } from '@mantine/core';
import { PAGE_WIDTH } from '@/constants/ui';
import DataFetchError, { type DataFetchErrorProps } from './DataFetchError';

/** Full-page error state for pages whose primary data failed to load. */
export default function PageFetchError(props: DataFetchErrorProps) {
  return (
    <Container size={PAGE_WIDTH.WIDE} py={{ base: 'lg', sm: 'xl' }}>
      <DataFetchError {...props} />
    </Container>
  );
}
