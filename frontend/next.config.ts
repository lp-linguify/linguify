// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  i18n: {
    // Liste des langues prises en charge (extensible jusqu'à 25 langues)
    locales: [
      'fr', 'en', 'es', 'nl'
      // Ajoutez d'autres langues au fur et à mesure
      // 'pt', 'zh', 'ja', 'ko', 'ru', 
      // 'ar', 'hi', 'bn', 'id', 'ms', 
      // 'th', 'vi', 'tr', 'pl', 'nl', 
      // 'sv', 'da', 'fi', 'no', 'he'
    ],
    // Langue par défaut
    defaultLocale: 'fr',
    
    // Détection automatique de la langue (basée sur l'en-tête Accept-Language)
    // localeDetection: false,
    
    // Optionnel: domaines spécifiques par langue
    // domains: [
    //   {
    //     domain: 'example.fr',
    //     defaultLocale: 'fr',
    //   },
    //   {
    //     domain: 'example.com',
    //     defaultLocale: 'en',
    //   },
    // ],
  },
  
  // Conserver votre configuration CORS existante
  async headers() {
    return [
      {
        source: '/api/auth/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
  }
};

export default nextConfig;