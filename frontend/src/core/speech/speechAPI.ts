// src/core/speech/speechAPI.ts

import apiClient from '@/core/api/apiClient';

// Interface pour les paramètres d'analyse de prononciation
interface PronunciationAnalysisParams {
  expectedText: string;
  spokenText: string;
  language: string;
  phraseId?: number;
}

// Interface pour le résultat d'analyse de prononciation
interface PronunciationAnalysisResult {
  score: number;
  mistakes: string[];
  correctPronunciation: string;
  suggestions: string;
}

/**
 * Service pour la reconnaissance vocale et l'analyse de prononciation
 */
const speechAPI = {
  /**
   * Analyse la prononciation en comparant le texte attendu avec la transcription parlée
   * 
   * @param params - Paramètres pour l'analyse de prononciation
   * @returns Résultat d'analyse avec score et commentaires
   */
  analyzePronunciation: async (params: PronunciationAnalysisParams): Promise<PronunciationAnalysisResult> => {
    try {
      // Appeler l'API backend pour l'analyse de prononciation
      const response = await apiClient.post('/api/v1/progress/analyze-pronunciation/', {
        expectedText: params.expectedText,
        spokenText: params.spokenText,
        language: params.language,
        phraseId: params.phraseId
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'analyse de la prononciation:', error);
      
      // Résultat par défaut en cas d'échec de l'appel API
      return speechAPI.mockAnalyzePronunciation(params);
    }
  },
  
  /**
   * Version factice de l'analyse pour le développement local sans API
   * Cette fonction peut être utilisée pendant le développement si l'API n'est pas disponible
   */
  mockAnalyzePronunciation: (params: PronunciationAnalysisParams): PronunciationAnalysisResult => {
    const { expectedText, spokenText } = params;
    
    // Algorithme simple de comparaison de texte pour simulation
    const normalizedExpected = expectedText.toLowerCase().trim();
    const normalizedSpoken = spokenText.toLowerCase().trim();
    
    // Calculer un score factice basé sur la similitude du texte
    let score = 0;
    if (normalizedSpoken === normalizedExpected) {
      score = 0.95; // Presque parfait
    } else if (normalizedSpoken.includes(normalizedExpected) || normalizedExpected.includes(normalizedSpoken)) {
      score = 0.8; // Très similaire
    } else {
      // Calcul basique de similitude
      const words1 = normalizedExpected.split(' ');
      const words2 = normalizedSpoken.split(' ');
      const commonWords = words1.filter(word => words2.includes(word));
      score = commonWords.length / Math.max(words1.length, words2.length);
    }
    
    // Générer des commentaires factices
    const mistakes: string[] = [];
    const suggestions = score > 0.7 
      ? "Bonne prononciation ! Continuez à pratiquer."
      : "Essayez de parler plus lentement et d'articuler chaque mot clairement.";
    
    // Ajouter quelques erreurs factices si le score est bas
    if (score < 0.7) {
      mistakes.push("Difficulté avec certains sons");
      
      if (params.language === 'fr') {
        mistakes.push("Attention aux sons nasaux");
      } else if (params.language === 'es') {
        mistakes.push("Le 'r' roulé peut être amélioré");
      }
    }
    
    return {
      score,
      mistakes,
      correctPronunciation: expectedText,
      suggestions
    };
  }
};

export default speechAPI;