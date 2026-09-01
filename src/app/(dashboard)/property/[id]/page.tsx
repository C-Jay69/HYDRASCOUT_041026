import { getPropertyById } from '@/lib/supabase-leads';
import { notFound } from 'next/navigation';
import PropertyDetailView from '@/components/PropertyDetailView';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PropertyPage({ params }: Props) {
  const { id } = await params;

  try {
    const property = await getPropertyById(id);

    if (!property) {
      notFound();
    }

    return (
      <div className="p-6">
        <PropertyDetailView property={property} />
      </div>
    );
  } catch (error) {
    console.error('Error fetching property:', error);
    notFound();
  }
}

