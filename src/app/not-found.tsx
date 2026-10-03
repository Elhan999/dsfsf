import { FiCompass } from 'react-icons/fi';
import { Page } from '@/components/layout/Page';
import { LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';

export default function NotFound() {
  return (
    <Page>
      <EmptyState
        icon={<FiCompass />}
        title="Page not found"
        description="The page you are looking for doesn't exist or was moved."
        action={<LinkButton href="/">Back home</LinkButton>}
      />
    </Page>
  );
}
