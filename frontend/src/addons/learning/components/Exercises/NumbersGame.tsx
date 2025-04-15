// src/app/(dashboard)/(apps)/learning/_components/Numbers/NumbersGame.tsx
'use client';

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Volume2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Number, FlashcardProps } from "@/addons/learning/types";

const NumbersGame = ({ lessonId, language = 'en' }: FlashcardProps) => {
    const [numbers, setNumbers] = useState<Number[]>([]);
    const [gameNumbers, setGameNumbers] = useState<Number[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [currentNumber, setCurrentNumber] = useState<Number | null>(null);
    const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [gameMode, setGameMode] = useState<'memorize' | 'match'>('memorize');

    useEffect(() => {
        const fetchNumbers = async () => {
            try {
                const response = await fetch(
                    `http://localhost:8000/api/v1/course/numbers/?content_lesson=${lessonId}&target_language=${language}`,
                    {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        },
                        mode: 'cors',
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch numbers');
                }

                const data = await response.json();
                setNumbers(data);
                // Prendre 6 nombres aléatoires pour le jeu
                const shuffled = [...data].sort(() => 0.5 - Math.random());
                setGameNumbers(shuffled.slice(0, 6));
                setCurrentNumber(shuffled[0]);
            } catch (err) {
                console.error('Error fetching numbers:', err);
                setError('Failed to load numbers');
            } finally {
                setLoading(false);
            }
        };

        fetchNumbers();
    }, [lessonId, language]);

    const speak = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'fr' ? 'fr-FR' : 'en-US';
        window.speechSynthesis.speak(utterance);
    };

    const handleCardFlip = (index: number) => {
        if (!flippedCards.includes(index)) {
            setFlippedCards([...flippedCards, index]);
            speak(gameNumbers[index].number);
        }
    };

    const handleNumberSelect = (selectedNum: string) => {
        if (currentNumber && selectedNum === currentNumber[`number_${language}`]) {
            setScore(score + 1);
            setIsCorrect(true);
            setTimeout(() => {
                const nextNumber = gameNumbers[score + 1];
                setCurrentNumber(nextNumber);
                setSelectedNumber(null);
                setIsCorrect(null);
            }, 1000);
        } else {
            setIsCorrect(false);
            setTimeout(() => {
                setSelectedNumber(null);
                setIsCorrect(null);
            }, 1000);
        }
    };

    const resetGame = () => {
        const shuffled = [...numbers].sort(() => 0.5 - Math.random());
        setGameNumbers(shuffled.slice(0, 6));
        setCurrentNumber(shuffled[0]);
        setScore(0);
        setSelectedNumber(null);
        setIsCorrect(null);
        setFlippedCards([]);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Game Controls */}
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-2">
                    <div className="text-2xl font-bold">Number Challenge</div>
                    <div className="text-sm text-muted-foreground">
                        {gameMode === 'memorize' ? 'Memorize the numbers' : 'Match the numbers'}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xl font-bold">
                        Score: {score}
                    </div>
                    <Button onClick={resetGame}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset
                    </Button>
                </div>
            </div>

            {/* Game Area */}
            <div className="space-y-8">
                {gameMode === 'memorize' ? (
                    <div className="grid grid-cols-3 gap-4">
                        {gameNumbers.map((num, index) => (
                            <motion.div
                                key={num.id}
                                whileHover={{ scale: 1.05 }}
                                className="relative"
                            >
                                <Card
                                    className={`p-6 cursor-pointer transition-all ${
                                        flippedCards.includes(index) ? 'bg-blue-50' : ''
                                    }`}
                                    onClick={() => handleCardFlip(index)}
                                >
                                    <AnimatePresence mode="wait">
                                        {flippedCards.includes(index) ? (
                                            <motion.div
                                                initial={{ rotateY: 180 }}
                                                animate={{ rotateY: 0 }}
                                                className="text-center"
                                            >
                                                <div className="text-2xl font-bold">{num.number}</div>
                                                <div className="text-sm text-muted-foreground mt-2">
                                                    {num[`number_${language}`]}
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div className="text-center text-4xl font-bold text-gray-300">
                                                ?
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {currentNumber && (
                            <>
                                <div className="text-center">
                                    <div className="text-4xl font-bold mb-2">
                                        {currentNumber.number}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => speak(currentNumber.number)}
                                    >
                                        <Volume2 className="h-4 w-4 mr-2" />
                                        Listen
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {gameNumbers.map((num) => (
                                        <Button
                                            key={num.id}
                                            variant="outline"
                                            className={`p-6 ${
                                                selectedNumber === num[`number_${language}`]
                                                    ? isCorrect
                                                        ? 'bg-green-100'
                                                        : 'bg-red-100'
                                                    : ''
                                            }`}
                                            onClick={() => handleNumberSelect(num[`number_${language}`])}
                                        >
                                            {num[`number_${language}`]}
                                        </Button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Game Controls */}
            <div className="mt-8 flex justify-center">
                <Button
                    variant="outline"
                    onClick={() => {
                        setGameMode(gameMode === 'memorize' ? 'match' : 'memorize');
                        resetGame();
                    }}
                >
                    Switch to {gameMode === 'memorize' ? 'Matching' : 'Memorization'} Mode
                </Button>
            </div>
        </div>
    );
};

export default NumbersGame;