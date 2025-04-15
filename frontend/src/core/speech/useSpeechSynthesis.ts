// src/core/speech/useSpeechSynthesis.ts

import { useState, useCallback, useEffect, useRef } from 'react';

interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface VoiceCache {
  [key: string]: SpeechSynthesisVoice | null;
}

export const useSpeechSynthesis = (targetLanguage: string) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // Refs for caching and tracking
  const voicesLoaded = useRef(false);
  const voiceCache = useRef<VoiceCache>({});
  const safetyTimerRef = useRef<number | null>(null);
  const speechQueue = useRef<{text: string, options: SpeechOptions}[]>([]);
  const processingQueue = useRef(false);
  
  // Language map with regional variations for better voice selection
  const getLanguageCodes = useCallback((langCode: string): string[] => {
    const langMap: { [key: string]: string[] } = {
      'EN': ['en-US', 'en-GB', 'en-AU'],
      'FR': ['fr-FR', 'fr-CA', 'fr-BE'],
      'NL': ['nl-BE', 'nl-NL'],
      'ES': ['es-ES', 'es-MX', 'es-US'],
      'DE': ['de-DE', 'de-AT', 'de-CH'],
      'IT': ['it-IT'],
      'PT': ['pt-PT', 'pt-BR'],
      'RU': ['ru-RU'],
      'JA': ['ja-JP'],
      'KO': ['ko-KR'],
      'ZH': ['zh-CN', 'zh-TW', 'zh-HK']
    };
    
    return langMap[langCode] || ['en-US'];
  }, []);
  
  // Initialize and preload voice data
  useEffect(() => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported");
      return;
    }
    
    // Function to load and cache voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesLoaded.current = true;
        // Pre-select and cache best voices for each language
        Object.keys(getLanguageCodes('placeholder')).forEach(langCode => {
          const prefLangs = getLanguageCodes(langCode);
          selectBestVoice(voices, prefLangs);
        });
        setIsReady(true);
      }
    };
    
    // Check if voices are already available
    loadVoices();
    
    // Set up event for voice loading
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Pre-warm the speech synthesis engine with a silent utterance
    const warmUpSpeech = () => {
      try {
        const utterance = new SpeechSynthesisUtterance('');
        utterance.volume = 0;
        utterance.rate = 1;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        // Ignore errors during warm-up
      }
    };
    
    // Warm up with a small delay
    const warmupTimer = setTimeout(warmUpSpeech, 500);
    
    return () => {
      clearTimeout(warmupTimer);
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
      }
      
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (error) {
          console.error("Error cancelling speech on unmount:", error);
        }
      }
    };
  }, []);
  
  // Premium voice selection logic with caching
  const selectBestVoice = useCallback((voices: SpeechSynthesisVoice[], preferredLangs: string[]): SpeechSynthesisVoice | null => {
    // Create a cache key from preferred languages
    const cacheKey = preferredLangs.join('_');
    
    // Return cached voice if available
    if (voiceCache.current[cacheKey]) {
      return voiceCache.current[cacheKey];
    }
    
    // Filter voices by preferred languages - use a single pass with reduce
    const candidatesByPriority = voices.reduce((acc, voice) => {
      const isPreferredLang = preferredLangs.some(lang => voice.lang.toLowerCase().startsWith(lang.toLowerCase()));
      if (!isPreferredLang) return acc;
      
      const voiceName = voice.name.toLowerCase();
      
      // Determine voice priority
      if (voice.name.includes('Google') && voiceName.includes('premium')) {
        acc.googlePremium.push(voice);
      } else if (voice.name.includes('Google')) {
        acc.google.push(voice);
      } else if (voiceName.includes('premium') || voiceName.includes('enhanced') || voiceName.includes('neural')) {
        acc.premium.push(voice);
      } else if (
        voiceName.includes('female') || 
        voice.name.includes('f') ||
        voiceName.includes('samantha') ||
        voiceName.includes('victoria') ||
        voiceName.includes('audrey') ||
        voiceName.includes('amélie') ||
        voiceName.includes('joana')
      ) {
        acc.female.push(voice);
      } else {
        acc.other.push(voice);
      }
      
      return acc;
    }, {
      googlePremium: [] as SpeechSynthesisVoice[],
      google: [] as SpeechSynthesisVoice[],
      premium: [] as SpeechSynthesisVoice[],
      female: [] as SpeechSynthesisVoice[],
      other: [] as SpeechSynthesisVoice[]
    });
    
    // Select the highest priority voice available
    let selectedVoice: SpeechSynthesisVoice | null = null;
    
    if (candidatesByPriority.googlePremium.length > 0) {
      selectedVoice = candidatesByPriority.googlePremium[0];
    } else if (candidatesByPriority.google.length > 0) {
      selectedVoice = candidatesByPriority.google[0];
    } else if (candidatesByPriority.premium.length > 0) {
      selectedVoice = candidatesByPriority.premium[0];
    } else if (candidatesByPriority.female.length > 0) {
      selectedVoice = candidatesByPriority.female[0];
    } else if (candidatesByPriority.other.length > 0) {
      selectedVoice = candidatesByPriority.other[0];
    }
    
    // Cache the result
    voiceCache.current[cacheKey] = selectedVoice;
    
    return selectedVoice;
  }, []);
  
  // Process the speech queue
  const processQueue = useCallback(() => {
    if (processingQueue.current || speechQueue.current.length === 0) {
      return;
    }
    
    processingQueue.current = true;
    const { text, options } = speechQueue.current.shift()!;
    
    // Perform the speech
    performSpeech(text, options, () => {
      // When speech is done, process the next item in queue
      processingQueue.current = false;
      processQueue();
    });
  }, []);
  
  // Split long text for better stability
  const splitTextForSpeech = useCallback((text: string): string[] => {
    // Return empty if no text
    if (!text) return [];
    
    // Split by natural breaks first (sentences, commas)
    const segments = text
      .replace(/([.!?])\s+/g, '$1|')  // Split by end of sentences
      .replace(/([,;:])\s+/g, '$1|')  // Split by commas, semicolons, etc
      .split('|')
      .filter(segment => segment.trim().length > 0);
    
    // If natural splits create excessively long segments, split further
    const result: string[] = [];
    const MAX_CHARS = 200;
    
    for (const segment of segments) {
      if (segment.length <= MAX_CHARS) {
        result.push(segment);
      } else {
        // Try to split by spaces if segment is too long
        const words = segment.split(' ');
        let currentChunk = '';
        
        for (const word of words) {
          if ((currentChunk + ' ' + word).length <= MAX_CHARS) {
            currentChunk += (currentChunk ? ' ' : '') + word;
          } else {
            if (currentChunk) {
              result.push(currentChunk);
            }
            currentChunk = word;
          }
        }
        
        if (currentChunk) {
          result.push(currentChunk);
        }
      }
    }
    
    return result;
  }, []);
  
  // The actual speech function
  const performSpeech = useCallback((
    text: string, 
    options: SpeechOptions = {}, 
    onComplete?: () => void
  ) => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported");
      if (onComplete) onComplete();
      return;
    }
    
    if (!text) {
      if (onComplete) onComplete();
      return;
    }
    
    setIsSpeaking(true);
    
    // Calculate safety timeout based on text length (avg reading speed)
    const safetyTimeout = Math.max(10000, text.length * 50); // 50ms per character, min 10s
    
    // Safety timeout to reset speaking state if speech events fail
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
    }
    
    safetyTimerRef.current = window.setTimeout(() => {
      console.warn("Speech safety timeout triggered");
      setIsSpeaking(false);
      if (onComplete) onComplete();
    }, safetyTimeout);
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get preferred language codes
    const preferredLangs = getLanguageCodes(targetLanguage);
    utterance.lang = preferredLangs[0]; // Set default lang
    
    // Set voice parameters
    utterance.rate = options.rate ?? 0.85;  // Slightly slower for clarity
    utterance.pitch = options.pitch ?? 1.05; // Slightly higher pitch for better quality
    utterance.volume = options.volume ?? 1.0; // Full volume
    
    // Handle speech events
    utterance.onend = () => {
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
      setIsSpeaking(false);
      if (onComplete) onComplete();
    };
    
    utterance.onerror = (event) => {
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
      
      // Ignore cancellation and interruption errors as they're often normal
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        console.error("Speech synthesis error:", event);
      }
      
      setIsSpeaking(false);
      if (onComplete) onComplete();
    };
    
    // Get available voices - use cached voices if available
    const allVoices = window.speechSynthesis.getVoices();
    
    // Select the best voice
    const bestVoice = selectBestVoice(allVoices, preferredLangs);
    
    if (bestVoice) {
      utterance.voice = bestVoice;
    } else if (allVoices.length > 0) {
      // Fallback to any voice in our preferred language
      const fallbackVoice = allVoices.find(voice => 
        preferredLangs.some(lang => voice.lang.startsWith(lang))
      );
      if (fallbackVoice) {
        utterance.voice = fallbackVoice;
      }
    }
    
    // Finally speak the text
    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Error during speech:", error);
      setIsSpeaking(false);
      if (onComplete) onComplete();
    }
  }, [getLanguageCodes, selectBestVoice, targetLanguage]);
  
  // Reliable speech cancellation
  const ensureCancelled = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis?.speaking && !window.speechSynthesis?.pending) {
        resolve();
        return;
      }
      
      try {
        window.speechSynthesis.cancel();
        
        // Some browsers need time to process the cancellation
        const maxWait = 100;
        const startTime = Date.now();
        
        const checkCancellation = () => {
          if (!window.speechSynthesis?.speaking && !window.speechSynthesis?.pending) {
            resolve();
            return;
          }
          
          if (Date.now() - startTime > maxWait) {
            // Last attempt before giving up
            try {
              window.speechSynthesis.cancel();
            } catch (e) {
              // Ignore
            }
            resolve();
            return;
          }
          
          setTimeout(checkCancellation, 10);
        };
        
        checkCancellation();
      } catch (error) {
        console.error("Error during speech cancellation:", error);
        resolve(); // Resolve anyway to prevent hanging
      }
    });
  }, []);
  
  // Main speak function with intelligent text handling
  const speak = useCallback(async (text: string, options: SpeechOptions = {}) => {
    if (!text) return;
    
    // Clear the queue for new speech
    speechQueue.current = [];
    
    // Ensure any ongoing speech is cancelled
    await ensureCancelled();
    setIsSpeaking(false);
    
    // For very long texts, split into manageable chunks
    const textSegments = splitTextForSpeech(text);
    
    if (textSegments.length === 0) return;
    
    if (textSegments.length === 1) {
      // Single segment, speak directly
      performSpeech(textSegments[0], options);
    } else {
      // Multiple segments, queue them
      textSegments.forEach(segment => {
        speechQueue.current.push({ text: segment, options });
      });
      
      // Start processing the queue
      processQueue();
    }
  }, [performSpeech, ensureCancelled, splitTextForSpeech, processQueue]);
  
  // Function to stop speaking
  const stop = useCallback(async () => {
    // Clear queue
    speechQueue.current = [];
    
    // Cancel ongoing speech
    await ensureCancelled();
    
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    
    setIsSpeaking(false);
  }, [ensureCancelled]);
  
  // Toggle function - useful for buttons
  const toggle = useCallback((text: string, options: SpeechOptions = {}) => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text, options);
    }
  }, [isSpeaking, speak, stop]);
  
  // Add speech to queue without interrupting current speech
  const enqueue = useCallback((text: string, options: SpeechOptions = {}) => {
    if (!text) return;
    
    const textSegments = splitTextForSpeech(text);
    
    textSegments.forEach(segment => {
      speechQueue.current.push({ text: segment, options });
    });
    
    // If not currently processing, start the queue
    if (!processingQueue.current) {
      processQueue();
    }
  }, [splitTextForSpeech, processQueue]);

  return {
    speak,
    stop,
    toggle,
    enqueue,
    isSpeaking,
    isReady
  };
};

export default useSpeechSynthesis;