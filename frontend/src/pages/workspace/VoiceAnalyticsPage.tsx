import { useParams } from 'react-router-dom';
import { VoiceAnalyticsDashboard } from '@/components/chat/VoiceAnalyticsDashboard';

export default function VoiceAnalyticsPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  return <VoiceAnalyticsDashboard workspaceId={id} />;
}
