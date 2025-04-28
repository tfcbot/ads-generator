import React from 'react';
import { AdsDetail } from '../../../components/AdsDetail';

export default async function AdsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  return <AdsDetail adId={id} />;
}
