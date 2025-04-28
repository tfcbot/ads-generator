import { ResearchDetail } from '../../../components/ResearchDetail';

export default async function DemoPage({ params }: { params: Promise<{ id: string }> }) {
  // then get id like this
  const id = (await params).id;
  return <ResearchDetail researchId={id} />;
}