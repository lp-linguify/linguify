// src/app/(landing)/features/apps/flashcards/page.tsx
import { Metadata } from 'next';
import FlashcardsComponent from './FlashcardsComponent';

export const metadata: Metadata = {
  title: 'Flashcards | Linguify',
  description: 'Accélérez votre apprentissage des langues avec nos flashcards intelligentes. Mémorisez du vocabulaire, des expressions et de la grammaire facilement grâce à notre système de répétition espacée.',
  keywords: ['flashcards linguify', 'fiches de révision', 'mémorisation langue', 'répétition espacée', 'apprentissage efficace'],
  openGraph: {
    title: 'Flashcards Linguify - Mémorisation efficace du vocabulaire',
    description: 'Mémorisez du vocabulaire en un temps record avec notre système de flashcards adaptatif basé sur la répétition espacée.',
    images: [
      {
        url: 'https://linguify.com/features/flashcards-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Application de flashcards Linguify',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flashcards Linguify - Mémorisation rapide',
    description: 'Accélérez votre apprentissage des langues avec nos flashcards intelligentes et notre système de répétition espacée.',
    images: ['https://linguify.com/features/flashcards-twitter.jpg'],
  },
};

export default function FlashcardsFeaturePage() {
  return <FlashcardsComponent />;
}