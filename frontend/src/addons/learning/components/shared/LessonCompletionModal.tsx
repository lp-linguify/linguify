import React, { useState, useEffect } from 'react';
import { CheckCircle, Sparkles, Trophy } from 'lucide-react';
import { LessonCompletionModalProps } from "@/addons/learning/types";

/**
 * LessonCompletionModal - Un composant réutilisable pour afficher un message
 * de réussite lorsqu'un utilisateur complète une leçon.
 * 
 * @param {Object} props - Les propriétés du composant
 * @param {boolean} props.show - Indique si le modal doit être affiché
 * @param {Function} props.onKeepReviewing - Handler pour continuer à réviser
 * @param {Function} props.onComplete - Handler pour terminer la leçon
 * @param {Function} props.onTryAgain - Handler pour réessayer (optionnel)
 * @param {Function} props.onBackToLessons - Handler pour retourner aux leçons (optionnel)
 * @param {string} props.title - Titre du message (par défaut: "Lesson Complete!")
 * @param {string} props.subtitle - Sous-titre ou message (optionnel)
 * @param {string} props.score - Score à afficher (optionnel, format: "X/Y")
 * @param {string} props.type - Type de complétion ("lesson", "quiz", "exercise")
 * @param {string} props.completionMessage - Message de réussite personnalisé
 */

const LessonCompletionModal: React.FC<LessonCompletionModalProps> = ({
  show,
  onKeepReviewing,
  onComplete,
  onTryAgain,
  onBackToLessons,
  title = "Lesson Complete!",
  subtitle,
  score,
  type = "lesson",
  completionMessage = "Great work! You've completed all the content in this lesson."
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsVisible(true);
      }, 10);
    } else {
      setIsVisible(false);
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
  }, [show]);

  if (!isAnimating) return null;

  const renderButtons = () => {
    if (type === "quiz") {
      return (
        <div className="flex gap-3 justify-center">
          {onBackToLessons && (
            <button
              onClick={onBackToLessons}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
            >
              Back to Lessons
            </button>
          )}
          {onTryAgain && (
            <button
              onClick={onTryAgain}
              className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
            >
              Try Again
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="flex gap-3 justify-center">
        {onKeepReviewing && (
          <button
            onClick={onKeepReviewing}
            className="px-4 py-2 border border-purple-300 rounded-md bg-white text-purple-700 hover:bg-purple-50"
          >
            Keep Reviewing
          </button>
        )}
        {onComplete && (
          <button
            onClick={onComplete}
            className="px-4 py-2 rounded-md bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-400 text-white hover:opacity-90"
          >
            Complete Lesson
          </button>
        )}
      </div>
    );
  };

  const getIcon = () => {
    switch (type) {
      case 'quiz':
        return <CheckCircle className="w-8 h-8 text-white" />;
      case 'exercise':
        return <Trophy className="w-8 h-8 text-white" />;
      default:
        return <Sparkles className="w-8 h-8 text-white" />;
    }
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div
        className={`bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4 text-center transition-all duration-300 ${isVisible ? 'transform-none opacity-100' : 'transform scale-95 opacity-0'
          }`}
      >
        {/* Header with icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-400 flex items-center justify-center">
            {getIcon()}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-400 text-transparent bg-clip-text">
          {title}
        </h2>

        {/* Score (if provided) */}
        {score && (
          <div className="mt-2 text-4xl font-bold">{score}</div>
        )}

        {/* Message */}
        <p className="text-gray-600 mt-4 mb-6">
          {subtitle || completionMessage}
        </p>

        {/* Action buttons */}
        {renderButtons()}
      </div>
    </div>
  );
};

export default LessonCompletionModal;