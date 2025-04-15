import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const VocabReview = () => {
  const initialVocab = [
    { 
      id: 1,
      word: 'bonjour', 
      translation: 'hello', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    },
    { 
      id: 2,
      word: 'au revoir', 
      translation: 'goodbye', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    },
    { 
      id: 3,
      word: 'merci', 
      translation: 'thank you', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    },
    { 
      id: 4,
      word: 's\'il vous plaît', 
      translation: 'please', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    },
    { 
      id: 5,
      word: 'comment allez-vous', 
      translation: 'how are you', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    },
    { 
      id: 6,
      word: 'oui', 
      translation: 'yes', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    },
    { 
      id: 7,
      word: 'non', 
      translation: 'no', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    },
    { 
      id: 8,
      word: 'excusez-moi', 
      translation: 'excuse me', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    },
    { 
      id: 9,
      word: 'pardon', 
      translation: 'sorry', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    },
    { 
      id: 10,
      word: 'je ne comprends pas', 
      translation: 'i don\'t understand', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    },
    { 
      id: 11,
      word: 'enchanté', 
      translation: 'nice to meet you', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    },
    { 
      id: 12,
      word: 'à bientôt', 
      translation: 'see you soon', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    },
    { 
      id: 13,
      word: 'bon appétit', 
      translation: 'enjoy your meal', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    },
    { 
      id: 14,
      word: 'bonne nuit', 
      translation: 'good night', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    },
    { 
      id: 15,
      word: 'bonne journée', 
      translation: 'have a good day', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    },
    { 
      id: 16,
      word: 'je m\'appelle', 
      translation: 'my name is', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    },
    { 
      id: 17,
      word: 'comment vous appelez-vous', 
      translation: 'what is your name', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    },
    { 
      id: 18,
      word: 'ravi de vous rencontrer', 
      translation: 'pleased to meet you', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    },
    { 
      id: 19,
      word: 'bon week-end', 
      translation: 'have a good weekend', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    },
    { 
      id: 20,
      word: 'à demain', 
      translation: 'see you tomorrow', 
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      mastered: false
    }
  ];

  const [vocab, setVocab] = useState(initialVocab);
  const [activeWords, setActiveWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [reviewMode, setReviewMode] = useState('write'); // 'write' ou 'swipe'
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Initialisation et mélange des mots à réviser
  useEffect(() => {
    shuffleAndFilterWords();
  }, []);

  const shuffleAndFilterWords = () => {
    const today = new Date();
    const wordsToReview = vocab.filter(word => {
      return new Date(word.nextReview) <= today && !word.mastered;
    });
    const shuffled = [...wordsToReview].sort(() => Math.random() - 0.5);
    setActiveWords(shuffled);
    setCurrentIndex(0);
  };

  const calculateNextReview = (reviewCount) => {
    const today = new Date();
    if (reviewCount >= 7) {
      // Mot maîtrisé - prochaine révision dans 30 jours
      return new Date(today.setDate(today.getDate() + 30));
    }
    // Espacer progressivement les révisions : 1, 3, 7, 14, 21 jours
    const delays = [1, 3, 7, 14, 21];
    const delay = delays[Math.min(reviewCount, delays.length - 1)];
    return new Date(today.setDate(today.getDate() + delay));
  };

  const handleReview = (isCorrect) => {
    const currentWord = activeWords[currentIndex];
    const updatedVocab = vocab.map(word => {
      if (word.id === currentWord.id) {
        const newReviewCount = isCorrect ? word.reviewCount + 1 : 0;
        const mastered = newReviewCount >= 7;
        return {
          ...word,
          reviewCount: newReviewCount,
          lastReviewed: new Date(),
          nextReview: calculateNextReview(newReviewCount),
          mastered: mastered
        };
      }
      return word;
    });

    setVocab(updatedVocab);
    setFeedback(isCorrect ? 'Correct ! 👍' : 'Incorrect. Réessayez !');
    setShowTranslation(true);

    if (isCorrect) {
      setTimeout(nextWord, 1500);
    }
  };

  const handleSwipe = (direction) => {
    const isCorrect = direction === 'right';
    handleReview(isCorrect);
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleSwipe('left');
    } else if (isRightSwipe) {
      handleSwipe('right');
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const checkWrittenAnswer = () => {
    const isCorrect = userInput.toLowerCase().trim() === activeWords[currentIndex].translation.toLowerCase();
    handleReview(isCorrect);
  };

  const nextWord = () => {
    if (currentIndex < activeWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowTranslation(false);
      setUserInput('');
      setFeedback('');
    } else {
      shuffleAndFilterWords();
    }
  };

  const masteredCount = vocab.filter(word => word.mastered).length;
  const totalWords = vocab.length;

  return (
    <div className="p-4 max-w-md mx-auto">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Révision</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm">Écrire</span>
              <Switch
                checked={reviewMode === 'swipe'}
                onCheckedChange={(checked) => setReviewMode(checked ? 'swipe' : 'write')}
              />
              <span className="text-sm">Swipe</span>
            </div>
          </div>

          <div className="mb-4">
            <Badge className="mb-2">
              Mots maîtrisés : {masteredCount}/{totalWords}
            </Badge>
          </div>

          {activeWords.length > 0 && (
            <div
              className="mb-6"
              onTouchStart={reviewMode === 'swipe' ? handleTouchStart : undefined}
              onTouchMove={reviewMode === 'swipe' ? handleTouchMove : undefined}
              onTouchEnd={reviewMode === 'swipe' ? handleTouchEnd : undefined}
            >
              <div className="text-center mb-4">
                <p className="text-lg font-semibold">{activeWords[currentIndex].word}</p>
                {showTranslation && (
                  <p className="text-gray-600">{activeWords[currentIndex].translation}</p>
                )}
              </div>

              {reviewMode === 'write' ? (
                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Entrez la traduction"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={showTranslation}
                  />
                  <Button 
                    onClick={checkWrittenAnswer}
                    className="w-full"
                    disabled={showTranslation}
                  >
                    Vérifier
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between px-8">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleSwipe('left')}
                    className="rounded-full"
                  >
                    <X className="h-6 w-6 text-red-500" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleSwipe('right')}
                    className="rounded-full"
                  >
                    <Check className="h-6 w-6 text-green-500" />
                  </Button>
                </div>
              )}

              {feedback && (
                <p className="mt-4 text-center font-medium">{feedback}</p>
              )}

              <div className="mt-4 text-center text-sm text-gray-500">
                Révisions : {activeWords[currentIndex].reviewCount}/7
              </div>
            </div>
          )}

          {activeWords.length === 0 && (
            <div className="text-center py-8">
              <p>Toutes les révisions du jour sont terminées ! 🎉</p>
              <p className="text-sm text-gray-500 mt-2">
                Revenez plus tard pour de nouvelles révisions
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VocabReview;