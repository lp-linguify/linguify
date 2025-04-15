// app/flashcard/explore/[id]/page.tsx
import PublicDeckDetail from '@/addons/flashcard/components/public/PublicDeckDetail';

export default function DeckDetailPage({ params }: { params: { id: string } }) {
    return <PublicDeckDetail deckId={parseInt(params.id)} />;
  }