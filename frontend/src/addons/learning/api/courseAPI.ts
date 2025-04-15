// src/services/courseAPI.ts

import apiClient from '@/core/api/apiClient';
import { getUserTargetLanguage, getUserNativeLanguage } from '@/core/utils/languageUtils';
import { Cache } from "@/core/utils/cacheUtils";
import {
  MatchingResult,
  LessonsByContentResponse,
  TheoryData
} from "@/addons/learning/types/";


const adaptTheoryContent = (data: any): TheoryData => {
  // Si les données sont déjà au nouveau format JSON, retournez-les directement
  if (data.using_json_format && data.language_specific_content) {
    return data as TheoryData;
  }
  
  // Sinon, convertissez l'ancien format vers le nouveau format pour la compatibilité frontend
  const availableLanguages = ['en', 'fr', 'es', 'nl'].filter(lang => {
    return data[`content_${lang}`] && data[`content_${lang}`].trim() !== '';
  });
  
  const languageSpecificContent: Record<string, Record<string, string>> = {};
  for (const lang of availableLanguages) {
    languageSpecificContent[lang] = {
      content: data[`content_${lang}`] || '',
      explanation: data[`explication_${lang}`] || '',
      formula: data[`formula_${lang}`] || '',
      example: data[`example_${lang}`] || '',
      exception: data[`exception_${lang}`] || ''
    };
  }
  
  return {
    ...data,
    using_json_format: true,
    available_languages: availableLanguages,
    language_specific_content: languageSpecificContent
  } as TheoryData;
};


const courseAPI = {
  getUnits: async (level?: string, targetLanguage?: string) => {
    try {
      const params: Record<string, string> = {};
      if (level) params.level = level;

      // Utiliser la langue spécifiée ou récupérer depuis localStorage
      const lang = targetLanguage || getUserTargetLanguage();
      params.target_language = lang;

      console.log('Fetching units with language:', lang);
      const response = await apiClient.get('/api/v1/course/units/', {
        params,
        headers: {
          'Accept-Language': lang
        }
      });
      return response.data;
    } catch (err: any) {
      console.error('Failed to fetch units:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      throw new Error(`Failed to fetch units: ${err.message}`);
    }
  },

  getLessons: async (unitId: number | string, targetLanguage?: string) => {
    try {
      // Validate unit ID to prevent NaN being sent to the API
      const parsedUnitId = Number(unitId);

      if (isNaN(parsedUnitId)) {
        console.error(`Invalid unit ID provided: ${unitId}`);
        return []; // Return empty array instead of failing completely
      }

      // Générer une clé de cache unique pour cette requête
      const lang = targetLanguage || getUserTargetLanguage();
      const cacheKey = `lessons_${parsedUnitId}_${lang}`;

      // Vérifier si les données sont déjà en cache
      const cachedData = Cache.get(cacheKey);
      if (cachedData) {
        console.log(`Using cached lessons for unit ${parsedUnitId} with language ${lang}`);
        return cachedData;
      }

      // Si pas en cache, continuer avec la requête API
      const params: Record<string, string> = {
        unit: parsedUnitId.toString(),
        target_language: lang
      };

      console.log(`API: Fetching lessons for unit ${parsedUnitId} with language ${lang}`);
      const response = await apiClient.get('/api/v1/course/lesson/', {
        params,
        headers: {
          'Accept-Language': lang
        }
      });

      // Mettre les données en cache pour les futures requêtes
      if (response.data && Array.isArray(response.data)) {
        Cache.set(cacheKey, response.data);
      }

      return response.data;
    } catch (err: any) {
      console.error('Failed to fetch lessons:', err);
      return []; // Return empty array on error to prevent cascade failures
    }
  },

  getLessonsByContentType: async (contentType: string, level?: string): Promise<LessonsByContentResponse> => {
    try {
      // Modification: accepter une chaîne vide comme valeur valide
      // mais log pour débogage
      if (contentType === undefined || contentType === null) {
        console.warn('Content type undefined or null, using empty string');
        contentType = '';
      }
  
      // Générer une clé de cache unique pour cette requête
      const lang = getUserTargetLanguage();
      const levelParam = level && level !== "all" ? level : "";
      const cacheKey = `lessons_by_content_${contentType}_${lang}_${levelParam}`;
      
      // Ne pas utiliser le cache pour les requêtes "all" ou chaîne vide
      const isAllContentTypes = contentType === "all" || contentType === "";
      const cachedData = isAllContentTypes ? null : Cache.get(cacheKey);
      
      if (cachedData) {
        console.log(`Using cached lessons for content type ${contentType} with language ${lang}`);
        return cachedData as LessonsByContentResponse;
      }
  
      console.log(`API: Fetching lessons with content type '${contentType}' with language ${lang}`);
  
      // Préparer les paramètres de requête
      const params: Record<string, string> = {
        target_language: lang
      };
  
      // Ajouter content_type uniquement s'il n'est pas vide
      // Le backend a été modifié pour gérer l'absence de ce paramètre
      if (contentType && contentType !== "all") {
        params.content_type = contentType;
      }
      
      // Ajouter le filtre de niveau si spécifié
      if (level && level !== "all") {
        params.level = level;
      }
  
      console.log('API request parameters:', params);
  
      // Appel API
      const response = await apiClient.get('/api/v1/course/lessons-by-content/', {
        params
      });
  
      // Vérifier que la réponse a le format attendu
      let responseData: LessonsByContentResponse;
  
      if (response.data && response.data.results) {
        // La réponse est déjà au bon format
        responseData = response.data as LessonsByContentResponse;
      } else if (Array.isArray(response.data)) {
        // La réponse est un tableau brut, le formater
        responseData = {
          results: response.data,
          metadata: {
            content_type: contentType,
            target_language: lang,
            available_levels: [],
            total_count: response.data.length
          }
        };
      } else {
        // Format de réponse inattendu, créer une structure vide
        responseData = {
          results: [],
          metadata: {
            content_type: contentType,
            target_language: lang,
            available_levels: [],
            total_count: 0
          }
        };
      }
  
      // Mettre les données en cache pour les futures requêtes (sauf pour "all")
      if (!isAllContentTypes) {
        Cache.set(cacheKey, responseData);
      }
  
      return responseData;
    } catch (err: any) {
      // Capture détaillée de l'erreur
      const errorMessage = err.message || 'Unknown error';
      console.error('Failed to fetch lessons by content type:', err);
  
      // L'objet de réponse inclut maintenant un champ error valide
      return {
        results: [],
        metadata: {
          content_type: contentType || '',
          target_language: getUserTargetLanguage(),
          available_levels: [],
          total_count: 0,
          error: errorMessage
        }
      };
    }
  },

  getContentLessons: async (lessonId: number | string, targetLanguage?: string) => {
    try {
      // Validate lesson ID
      const parsedLessonId = Number(lessonId);

      if (isNaN(parsedLessonId)) {
        console.error(`Invalid lesson ID provided: ${lessonId}`);
        return [];
      }

      const params: Record<string, string> = {
        lesson: parsedLessonId.toString()
      };

      // Utiliser la langue spécifiée ou récupérer depuis localStorage
      const lang = targetLanguage || getUserTargetLanguage();
      params.target_language = lang;

      console.log(`Fetching content lessons for lesson ${parsedLessonId} with language: ${lang}`);
      const response = await apiClient.get(`/api/v1/course/content-lesson/`, {
        params,
        headers: {
          'Accept-Language': lang
        }
      });
      return response.data;
    } catch (err: any) {
      console.error('Failed to fetch content lessons:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      return []; // Return empty array on error
    }
  },

  getTheoryContent: async (contentLessonId: number | string, targetLanguage?: string) => {
    try {
      // Validate content lesson ID
      const parsedContentLessonId = Number(contentLessonId);

      if (isNaN(parsedContentLessonId)) {
        console.error(`Invalid content lesson ID provided: ${contentLessonId}`);
        return [];
      }

      const params: Record<string, string> = {
        content_lesson: parsedContentLessonId.toString()
      };

      // Utiliser la langue spécifiée ou récupérer depuis localStorage
      const lang = targetLanguage || getUserTargetLanguage();
      params.target_language = lang;

      console.log(`Fetching theory content for content lesson ${parsedContentLessonId} with language: ${lang}`);
      const response = await apiClient.get(`/api/v1/course/theory-content/`, {
        params,
        headers: {
          'Accept-Language': lang
        }
      });
      if (Array.isArray(response.data)) {
        return response.data.map((item: any) => adaptTheoryContent(item));
      }

      return [adaptTheoryContent(response.data)];
    } catch (err) {
      console.error('Failed to fetch theory content:', err);
      return [];
    }
  },

  getVocabularyContent: async (contentLessonId: number | string, targetLanguage?: string) => {
    try {
      // Validate content lesson ID
      const parsedContentLessonId = Number(contentLessonId);

      if (isNaN(parsedContentLessonId)) {
        console.error(`Invalid content lesson ID provided: ${contentLessonId}`);
        return { results: [] }; // Match expected API response format
      }

      const params: Record<string, string> = {
        content_lesson: parsedContentLessonId.toString()
      };

      // Utiliser la langue spécifiée ou récupérer depuis localStorage
      const lang = targetLanguage || getUserTargetLanguage();
      params.target_language = lang;

      console.log(`Fetching vocabulary for content lesson ${parsedContentLessonId} with language: ${lang}`);
      const response = await apiClient.get(`/api/v1/course/vocabulary-list/`, {
        params,
        headers: {
          'Accept-Language': lang
        }
      });
      return response.data;
    } catch (err: any) {
      console.error('Failed to fetch vocabulary content:', err);
      return { results: [] }; // Match expected API response format
    }
  },

  getFillBlankExercises: async (contentLessonId: number | string, targetLanguage?: string) => {
    try {
      // Validate content lesson ID
      const parsedContentLessonId = Number(contentLessonId);

      if (isNaN(parsedContentLessonId)) {
        console.error(`Invalid content lesson ID provided: ${contentLessonId}`);
        return []; // Return empty array if ID is invalid
      }

      const params: Record<string, string> = {
        content_lesson: parsedContentLessonId.toString()
      };

      // Utiliser la langue spécifiée ou récupérer depuis localStorage
      const lang = targetLanguage || getUserTargetLanguage();
      params.language = lang;

      console.log(`Fetching fill in the blank exercises for content lesson ${parsedContentLessonId} with language: ${lang}`);
      const response = await apiClient.get(`/api/v1/course/fill-blank/`, {
        params,
        headers: {
          'Accept-Language': lang
        }
      });

      return response.data;
    } catch (err: any) {
      console.error('Failed to fetch fill in the blank exercises:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      return []; // Return empty array on error
    }
  },

  checkFillBlankAnswer: async (exerciseId: number, answer: string, language?: string) => {
    try {
      // Validate exercise ID
      if (isNaN(exerciseId)) {
        console.error(`Invalid exercise ID provided: ${exerciseId}`);
        return { is_correct: false, error: 'Invalid exercise ID' };
      }

      // Get target language from user settings if not provided
      const lang = language || getUserTargetLanguage();

      console.log(`Checking fill in the blank answer for exercise ${exerciseId} with language: ${lang}`);
      const response = await apiClient.post(`/api/v1/course/fill-blank/${exerciseId}/check-answer/`, {
        answer,
        language: lang
      });

      return response.data;
    } catch (err: any) {
      console.error('Failed to check fill in the blank answer:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      return { is_correct: false, error: 'Failed to check answer' };
    }
  },

  getMatchingExercises: async (contentLessonId: number | string, targetLanguage?: string) => {
    try {
      // Valider l'ID de la leçon
      const parsedContentLessonId = Number(contentLessonId);

      if (isNaN(parsedContentLessonId)) {
        console.error(`Invalid content lesson ID provided: ${contentLessonId}`);
        return [];
      }

      const params: Record<string, string> = {
        content_lesson: parsedContentLessonId.toString()
      };

      // Utiliser la langue spécifiée ou récupérer depuis localStorage
      const nativeLanguage = getUserNativeLanguage();
      const targetLang = targetLanguage || getUserTargetLanguage();

      params.native_language = nativeLanguage;
      params.target_language = targetLang;

      console.log(`Fetching matching exercises for content lesson ${parsedContentLessonId} with native language: ${nativeLanguage}, target language: ${targetLang}`);

      const response = await apiClient.get('/api/v1/course/matching/', {
        params,
        headers: {
          'Accept-Language': targetLang
        }
      });

      return response.data;
    } catch (err: any) {
      console.error('Failed to fetch matching exercises:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      return [];
    }
  },

  getMatchingExercise: async (exerciseId: number | string, targetLanguage?: string) => {
    try {
      // Valider l'ID de l'exercice
      const parsedExerciseId = Number(exerciseId);

      if (isNaN(parsedExerciseId)) {
        console.error(`Invalid matching exercise ID provided: ${exerciseId}`);
        return null;
      }

      const params: Record<string, string> = {};

      // Utiliser la langue spécifiée ou récupérer depuis localStorage
      const nativeLanguage = getUserNativeLanguage();
      const targetLang = targetLanguage || getUserTargetLanguage();

      params.native_language = nativeLanguage;
      params.target_language = targetLang;

      console.log(`Fetching matching exercise ${parsedExerciseId} with native language: ${nativeLanguage}, target language: ${targetLang}`);

      const response = await apiClient.get(`/api/v1/course/matching/${parsedExerciseId}/`, {
        params,
        headers: {
          'Accept-Language': targetLang
        }
      });

      return response.data;
    } catch (err: any) {
      console.error(`Failed to fetch matching exercise #${exerciseId}:`, {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      return null;
    }
  },

  checkMatchingAnswers: async (
    exerciseId: number | string,
    answers: Record<string, string>,
    targetLanguage?: string
  ): Promise<MatchingResult> => {
    try {
      // Valider l'ID de l'exercice
      const parsedExerciseId = Number(exerciseId);

      if (isNaN(parsedExerciseId)) {
        console.error(`Invalid matching exercise ID provided: ${exerciseId}`);
        throw new Error('Invalid exercise ID');
      }

      const params: Record<string, string> = {};

      // Utiliser la langue spécifiée ou récupérer depuis localStorage
      const nativeLanguage = getUserNativeLanguage();
      const targetLang = targetLanguage || getUserTargetLanguage();

      params.native_language = nativeLanguage;
      params.target_language = targetLang;

      console.log(`Checking matching answers for exercise ${parsedExerciseId} with native language: ${nativeLanguage}, target language: ${targetLang}`);

      try {
        const response = await apiClient.post(
          `/api/v1/course/matching/${parsedExerciseId}/check-answers/`,
          { answers },
          {
            params,
            headers: {
              'Accept-Language': targetLang
            }
          }
        );

        // Vérifier que la réponse a la forme attendue
        const data = response.data;
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format');
        }

        // Garantir que tous les champs nécessaires sont présents
        return {
          score: data.score || 0,
          message: data.message || 'No feedback available',
          correct_count: data.correct_count || 0,
          wrong_count: data.wrong_count || 0,
          total_count: data.total_count || 0,
          is_successful: !!data.is_successful,
          success_threshold: data.success_threshold || 60,
          feedback: data.feedback || {}
        };
      } catch (apiError: any) {
        // Capturer spécifiquement les erreurs API
        console.error('API error when checking matching answers:', {
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data
        });

        // Si l'API renvoie un message d'erreur structuré, l'utiliser
        if (apiError.response?.data?.error) {
          throw new Error(`Server error: ${apiError.response.data.error}`);
        }

        // Sinon, remonter l'erreur originale
        throw apiError;
      }
    } catch (err: any) {
      console.error('Failed to check matching answers:', err);

      // En cas d'erreur, renvoyer un objet résultat par défaut avec echec
      return {
        score: 0,
        message: `Error: ${err.message || 'An unknown error occurred'}`,
        correct_count: 0,
        wrong_count: 0,
        total_count: 0,
        is_successful: false,
        success_threshold: 60,
        feedback: {}
      };
    }
  },

  createMatchingExercise: async (
    contentLessonId: number | string,
    vocabularyIds?: number[],
    pairsCount?: number
  ) => {
    try {
      // Valider l'ID de la leçon
      const parsedContentLessonId = Number(contentLessonId);

      if (isNaN(parsedContentLessonId)) {
        console.error(`Invalid content lesson ID provided: ${contentLessonId}`);
        return null;
      }

      console.log(`Creating matching exercise for content lesson ${parsedContentLessonId}`);

      // URL correcte avec /auto-create/ à la fin
      const response = await apiClient.post('/api/v1/course/matching/auto-create/', {
        content_lesson_id: parsedContentLessonId,
        vocabulary_ids: vocabularyIds,
        pairs_count: pairsCount
      });

      return response.data;
    } catch (err: any) {
      console.error('Failed to create matching exercise:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      return null;
    }
  },

  getSpeakingExerciseVocabulary: async (contentLessonId: number | string, targetLanguage?: string) => {
    try {
      const parsedContentLessonId = Number(contentLessonId);
      if (isNaN(parsedContentLessonId)) {
        console.error(`Invalid content lesson ID provided: ${contentLessonId}`);
        return { results: [] };
      }

      const params: Record<string, string> = {
        content_lesson: parsedContentLessonId.toString()
      };

      // Make sure targetLanguage is set and properly passed
      const lang = targetLanguage || getUserTargetLanguage();
      params.target_language = lang;

      console.log(`Fetching speaking exercise vocabulary for content lesson ${parsedContentLessonId} with language: ${lang}`);
      // Note: URL fixed to match backend route without trailing slash
      const response = await apiClient.get(`/api/v1/course/speaking-exercise/vocabulary`, {
        params,
        headers: {
          'Accept-Language': lang
        }
      });

      // Log received data structure to debug
      console.log('Received speaking vocabulary data:', response.data);

      return response.data;
    } catch (err: any) {
      console.error('Failed to fetch speaking exercise vocabulary:', err);
      return { results: [] };
    }
  }

};

export default courseAPI;