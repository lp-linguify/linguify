'use client';

import React, { useState } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';

export default function BugSignalPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cc: '',
    identificationMethod: 'code',
    identificationValue: '',
    ticketType: '',
    subject: '',
    description: '',
    attachments: [] as File[]
  });

  const [status, setStatus] = useState({
    submitting: false,
    success: false,
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({ 
        ...prev, 
        attachments: [...prev.attachments, ...Array.from(e.target.files || [])]
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ ...status, submitting: true });
    
    // Simulation d'envoi
    setTimeout(() => {
      console.log('Bug report submitted:', formData);
      setStatus({
        submitting: false,
        success: true,
        message: 'Merci d\'avoir signalé ce bug. Nous traiterons votre demande dès que possible.'
      });
    }, 1500);
  };

  return (
    <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/contact" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la page contact
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-6 text-gray-900 italic">
          Besoin d'aide ?
          <span className="block h-1 w-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 mt-2"></span>
        </h1>

        {status.success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm leading-5 text-green-700">
                  {status.message}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de contact */}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Votre nom
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Votre adresse mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Votre numéro de téléphone <span className="text-gray-500 text-xs">(optionnel)</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="cc" className="block text-sm font-medium text-gray-700 mb-1">
                CC à <span className="text-gray-500 text-xs">(optionnel)</span>
              </label>
              <input
                type="text"
                id="cc"
                name="cc"
                value={formData.cc}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="par exemple: follower1@domain.com, ..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Veuillez noter que les abonnés recevront tous les messages qui seront partagés.
              </p>
            </div>
          </div>
          
          {/* Méthode d'identification */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <p className="font-medium text-gray-700">M'identifier grâce à mon</p>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  id="code"
                  name="identificationMethod"
                  type="radio"
                  value="code"
                  checked={formData.identificationMethod === 'code'}
                  onChange={handleRadioChange}
                  className="h-4 w-4 text-teal-600 border-gray-300"
                />
                <label htmlFor="code" className="ml-2 block text-sm text-gray-700">
                  Code d'abonnement
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="url"
                  name="identificationMethod"
                  type="radio"
                  value="url"
                  checked={formData.identificationMethod === 'url'}
                  onChange={handleRadioChange}
                  className="h-4 w-4 text-teal-600 border-gray-300"
                />
                <label htmlFor="url" className="ml-2 block text-sm text-gray-700">
                  URL de la base de données
                </label>
              </div>
            </div>
            
            <div>
              <input
                type="text"
                id="identificationValue"
                name="identificationValue"
                value={formData.identificationValue}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="M123456789101 ou SO2023/123456"
              />
            </div>
            
            <div className="flex items-center text-xs text-teal-600">
              <Info className="h-4 w-4 mr-1" />
              <span>Connectez-vous si vous ne connaissez pas le code de votre d'abonnement</span>
            </div>
          </div>
          
          {/* Type de ticket */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <p className="font-medium text-gray-700">Type de ticket</p>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  id="subscription"
                  name="ticketType"
                  type="radio"
                  value="subscription"
                  checked={formData.ticketType === 'subscription'}
                  onChange={handleRadioChange}
                  className="h-4 w-4 text-teal-600 border-gray-300"
                />
                <label htmlFor="subscription" className="ml-2 block text-sm text-gray-700">
                  Une question relative à mon abonnement ou ma facture
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="usage"
                  name="ticketType"
                  type="radio"
                  value="usage"
                  checked={formData.ticketType === 'usage'}
                  onChange={handleRadioChange}
                  className="h-4 w-4 text-teal-600 border-gray-300"
                />
                <label htmlFor="usage" className="ml-2 block text-sm text-gray-700">
                  Une question sur l'utilisation ou la configuration de Linguify
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="unexpected"
                  name="ticketType"
                  type="radio"
                  value="unexpected"
                  checked={formData.ticketType === 'unexpected'}
                  onChange={handleRadioChange}
                  className="h-4 w-4 text-teal-600 border-gray-300"
                />
                <label htmlFor="unexpected" className="ml-2 block text-sm text-gray-700">
                  Un comportement inattendu
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="sync"
                  name="ticketType"
                  type="radio"
                  value="sync"
                  checked={formData.ticketType === 'sync'}
                  onChange={handleRadioChange}
                  className="h-4 w-4 text-teal-600 border-gray-300"
                />
                <label htmlFor="sync" className="ml-2 block text-sm text-gray-700">
                  Un problème de synchronisation bancaire ou de paiement en ligne
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="access"
                  name="ticketType"
                  type="radio"
                  value="access"
                  checked={formData.ticketType === 'access'}
                  onChange={handleRadioChange}
                  className="h-4 w-4 text-teal-600 border-gray-300"
                />
                <label htmlFor="access" className="ml-2 block text-sm text-gray-700">
                  Je n'ai pas accès à mon compte Linguify
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="other"
                  name="ticketType"
                  type="radio"
                  value="other"
                  checked={formData.ticketType === 'other'}
                  onChange={handleRadioChange}
                  className="h-4 w-4 text-teal-600 border-gray-300"
                />
                <label htmlFor="other" className="ml-2 block text-sm text-gray-700">
                  Autre
                </label>
              </div>
            </div>
          </div>
          
          {/* Sujet et description */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Sujet
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description détaillée
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          
          {/* Pièces jointes */}
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700">
              Pièces jointes
            </label>
            
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
                <span>Select, fichiers</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <span className="text-sm text-gray-500">
                {formData.attachments.length > 0 
                  ? `${formData.attachments.length} fichier(s) sélectionné(s)` 
                  : 'Aucun fichier choisi'}
              </span>
            </div>
            
            <div>
              <button 
                type="button" 
                className="text-xs text-teal-600 flex items-center mt-2"
                onClick={() => {}}
              >
                <span className="mr-1">+</span> Ajouter plus de pièces jointes
              </button>
              
              <div className="flex items-center text-xs text-teal-600 mt-2">
                <Info className="h-4 w-4 mr-1" />
                <span>Veuillez ne pas inclure de données sensibles. Nous traiterons vos données comme décrit dans notre <a href="#" className="underline">Politique de confidentialité</a> pour vous aider à résoudre votre problème.</span>
              </div>
            </div>
          </div>
          
          {/* Bouton de soumission */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={status.submitting}
              className="w-full py-3 bg-purple-700 text-white font-medium rounded-md hover:bg-purple-800 transition-colors"
            >
              {status.submitting ? 'Envoi en cours...' : 'Soumettre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}