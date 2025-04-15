// src/app/(landing)/features/apps/progressPage/page.tsx
import { Metadata } from 'next';
import ProgressComponent from './ProgressComponent';

export const metadata: Metadata = {
  title: 'Progress Tracking | Linguify',
  description: 'Suivez et visualisez votre progression linguistique en temps réel. Définissez des objectifs, analysez vos performances et célébrez vos réussites grâce à notre système de suivi avancé.',
  keywords: ['suivi progression linguify', 'objectifs linguistiques', 'progression linguistique', 'statistiques apprentissage', 'analytics langue'],
  openGraph: {
    title: 'Linguify Progress - Visualisez votre parcours linguistique',
    description: 'Suivez vos progrès linguistiques avec des statistiques détaillées, des objectifs personnalisés et des visualisations motivantes pour atteindre vos objectifs plus rapidement.',
    images: [
      {
        url: 'https://linguify.com/features/progress-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Application de suivi de progression Linguify',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Linguify Progress - Suivi de progression linguistique',
    description: 'Visualisez vos progrès, définissez des objectifs et restez motivé tout au long de votre parcours d\'apprentissage des langues.',
    images: ['https://linguify.com/features/progress-twitter.jpg'],
  },
};

export default function ProgressFeaturePage() {
  return <ProgressComponent />;
}