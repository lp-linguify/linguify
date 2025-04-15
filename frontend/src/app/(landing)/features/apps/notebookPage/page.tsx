// src/app/(landing)/features/apps/notebookPage/page.tsx
import { Metadata } from 'next';
import NotebookComponent from './notebookComponent'

export const metadata: Metadata = {
  title: 'Notebook | Linguify',
  description: 'Organisez vos notes de langue avec notre application Notebook. Capturez, organisez et révisez efficacement vos apprentissages linguistiques avec des fonctionnalités avancées.',
  keywords: ['prise de notes linguify', 'notes de langue', 'organisation apprentissage', 'notebook linguistique', 'notes structurées'],
  openGraph: {
    title: 'Notebook Linguify - Organisez vos apprentissages linguistiques',
    description: 'Capturez et organisez vos notes linguistiques avec des fonctionnalités avancées : catégorisation, tags, recherche et intégration avec toutes vos ressources d\'apprentissage.',
    images: [
      {
        url: 'https://linguify.com/features/notebook-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Application Notebook Linguify',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Notebook Linguify - Notes linguistiques organisées',
    description: 'Capturez, organisez et révisez efficacement vos apprentissages linguistiques avec notre application de notes avancée.',
    images: ['https://linguify.com/features/notebook-twitter.jpg'],
  },
};

export default function NotebookFeaturePage() {
  return <NotebookComponent />;
}