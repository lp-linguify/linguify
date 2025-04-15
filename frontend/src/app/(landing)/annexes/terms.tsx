import React from 'react';
import { useRouter } from 'next/router';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="p-6 max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Conditions Générales d'Utilisation de Linguify
        </h1>
        
        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Objet</h2>
            <p>
              Les présentes Conditions Générales d'Utilisation ("CGU") ont pour objet de définir les droits et obligations
              des utilisateurs de l'application Linguify, une plateforme d'apprentissage des langues accessible via abonnement.
              Linguify est un produit créé par GPI Software qui a pour but d'améliorer l'éducation linguistique.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Acceptation des Conditions</h2>
            <p>
              En s'inscrivant sur Linguify et en utilisant l'application, l'utilisateur reconnaît avoir pris connaissance des
              présentes CGU et s'engage à les respecter.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Accès et Utilisation</h2>
            <p>
              Linguify est accessible via un abonnement mensuel de 10€. L'accès aux services est personnel et non cessible.
              L'utilisateur est responsable de la confidentialité de ses identifiants.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact</h2>
            <p>
              Pour toute question relative aux CGU, l'utilisateur peut contacter Linguify à l'adresse suivante : 
              <a 
                href="mailto:support@linguify.com" 
                className="text-blue-600 dark:text-blue-400 ml-2 hover:underline"
              >
                support@linguify.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}