'use client';
/**
 * ReorderingExercise component
 * This component allows users to reorder words to form a correct sentence.
 * It fetches a random exercise from the server and provides feedback on the user's input.
 */
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReorderingExerciseProps, Exercise } from "@/addons/learning/types";

export default function ReorderingExercise({ lessonId, language = 'en' }: ReorderingExerciseProps) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getSentenceForLanguage = (exercise: Exercise): string => {
    switch (language) {
      case 'fr':
        return exercise.sentence_fr;
      case 'es':
        return exercise.sentence_es;
      case 'nl':
        return exercise.sentence_nl;
      default:
        return exercise.sentence_en;
    }
  };

  const fetchExercise = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/course/reordering/random/?content_lesson=${lessonId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No exercises available for this lesson yet');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Exercise = await response.json();
      setExercise(data);

      const currentSentence = getSentenceForLanguage(data);
      const shuffledWords = currentSentence.split(' ').sort(() => Math.random() - 0.5);
      setWords(shuffledWords);
      setSelectedWords([]);
      setIsCorrect(false);
      setShowHint(false);
      setShowExplanation(false);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load exercise');
    }
  };

  useEffect(() => {
    fetchExercise();
  }, [lessonId, language]);

  useEffect(() => {
    if (exercise) {
      const correctSentence = getSentenceForLanguage(exercise);
      setIsCorrect(selectedWords.join(' ') === correctSentence);
    }
  }, [selectedWords, exercise, language]);

  const handleWordSelect = (word: string, index: number) => {
    setWords(words.filter((_, i) => i !== index));
    setSelectedWords([...selectedWords, word]);
  };

  const handleWordRemove = (index: number) => {
    const removedWord = selectedWords[index];
    setSelectedWords(selectedWords.filter((_, i) => i !== index));
    setWords([...words, removedWord]);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {language === 'fr' ? 'Réorganisez la phrase' :
              language === 'es' ? 'Reorganiza la frase' :
                language === 'nl' ? 'Zet de zin in de juiste volgorde' :
                  'Reorder the sentence'}
          </h2>
        </div>

        {/* Zone des mots disponibles */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">
            {language === 'fr' ? 'Mots disponibles :' :
              language === 'es' ? 'Palabras disponibles :' :
                language === 'nl' ? 'Beschikbare woorden :' :
                  'Available words:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {words.map((word, index) => (
              <Button
                key={index}
                variant="secondary"
                onClick={() => handleWordSelect(word, index)}
                className="px-3 py-1"
              >
                {word}
              </Button>
            ))}
          </div>
        </div>

        {/* Zone de construction de la phrase */}
        <div className="bg-gray-100 p-4 rounded-lg min-h-20">
          <p className="text-sm text-gray-500 mb-2">
            {language === 'fr' ? 'Votre phrase :' :
              language === 'es' ? 'Tu frase :' :
                language === 'nl' ? 'Jouw zin :' :
                  'Your sentence:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedWords.map((word, index) => (
              <Button
                key={index}
                variant="default"
                onClick={() => handleWordRemove(index)}
                className="px-3 py-1"
              >
                {word}
              </Button>
            ))}
          </div>
        </div>

        {/* Feedback et contrôles */}
        <div className="space-y-4">
          {isCorrect && (
            <Alert className="bg-green-50 text-green-700">
              <AlertDescription>
                {language === 'fr' ? 'Bravo ! La phrase est correcte !' :
                  language === 'es' ? '¡Bravo! ¡La frase es correcta!' :
                    language === 'nl' ? 'Goed gedaan! De zin is correct!' :
                      'Well done! The sentence is correct!'}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowHint(!showHint)}
            >
              {showHint ?
                (language === 'fr' ? "Masquer l'indice" :
                  language === 'es' ? "Ocultar la pista" :
                    language === 'nl' ? "Verberg hint" :
                      "Hide hint") :
                (language === 'fr' ? "Voir l'indice" :
                  language === 'es' ? "Ver pista" :
                    language === 'nl' ? "Toon hint" :
                      "Show hint")
              }
            </Button>

            {isCorrect && (
              <Button
                variant="outline"
                onClick={() => setShowExplanation(!showExplanation)}
              >
                {showExplanation ?
                  (language === 'fr' ? "Masquer l'explication" :
                    language === 'es' ? "Ocultar la explicación" :
                      language === 'nl' ? "Verberg uitleg" :
                        "Hide explanation") :
                  (language === 'fr' ? "Voir l'explication" :
                    language === 'es' ? "Ver explicación" :
                      language === 'nl' ? "Toon uitleg" :
                        "Show explanation")
                }
              </Button>
            )}

            <Button onClick={fetchExercise}>
              {language === 'fr' ? 'Nouvel exercice' :
                language === 'es' ? 'Nuevo ejercicio' :
                  language === 'nl' ? 'Nieuwe oefening' :
                    'New exercise'}
            </Button>
          </div>

          {showHint && exercise?.hint && (
            <Alert>
              <AlertDescription>{exercise.hint}</AlertDescription>
            </Alert>
          )}

          {showExplanation && exercise?.explanation && (
            <Alert>
              <AlertDescription>{exercise.explanation}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </Card>
  );
}