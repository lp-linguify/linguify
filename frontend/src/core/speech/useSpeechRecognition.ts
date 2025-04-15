// src/core/speech/useSpeechRecognition.ts

import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

interface SpeechRecognitionResult {
  transcript: string;
  isRecording: boolean;
  error: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  resetTranscript: () => void;
  recognition: any; // Instance SpeechRecognition
}

/**
 * Hook personnalisé pour utiliser l'API de reconnaissance vocale du navigateur
 * @param options Options de configuration pour la reconnaissance vocale
 */
export function useSpeechRecognition(options: SpeechRecognitionOptions = {}): SpeechRecognitionResult {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Configuration de la reconnaissance vocale
  useEffect(() => {
    if (typeof window === 'undefined') {
      setError('La reconnaissance vocale n\'est pas disponible côté serveur');
      return;
    }

    // Vérifier si le navigateur prend en charge la reconnaissance vocale
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Votre navigateur ne prend pas en charge la reconnaissance vocale');
      return;
    }

    // Créer une instance de reconnaissance vocale
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Configurer la reconnaissance
    recognition.continuous = options.continuous ?? false;
    recognition.interimResults = options.interimResults ?? true;
    recognition.lang = options.language ?? 'fr-FR';
    recognition.maxAlternatives = options.maxAlternatives ?? 1;

    // Configurer les gestionnaires d'événements
    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const newTranscript = result[0].transcript;
      setTranscript(newTranscript);
    };

    recognition.onerror = (event: any) => {
      // Certains navigateurs déclenchent une erreur "no-speech" s'il n'y a pas de parole détectée
      // C'est un comportement normal et nous ne voulons pas effrayer l'utilisateur
      if (event.error === 'no-speech') {
        console.log('Aucune parole détectée');
        return;
      }
      
      console.error('Erreur de reconnaissance vocale:', event.error);
      setError(`Erreur de reconnaissance: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    // Nettoyage à la démontage du composant
    return () => {
      if (recognition) {
        try {
          recognition.abort();
        } catch (e) {
          console.error('Erreur lors de l\'arrêt de la reconnaissance vocale:', e);
        }
      }
    };
  }, [options.continuous, options.interimResults, options.language, options.maxAlternatives]);

  // Démarrer l'enregistrement
  const startRecording = useCallback(() => {
    if (!recognitionRef.current) {
      setError('La reconnaissance vocale n\'est pas disponible');
      return;
    }

    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error('Erreur au démarrage de la reconnaissance vocale:', err);
      setError('Échec du démarrage de la reconnaissance vocale');
    }
  }, []);

  // Arrêter l'enregistrement
  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
      // setIsRecording sera défini sur false par l'événement onend
    } catch (err) {
      console.error('Erreur lors de l\'arrêt de la reconnaissance vocale:', err);
    }
  }, []);

  // Réinitialiser la transcription
  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript,
    isRecording,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
    recognition: recognitionRef.current
  };
}