'use client';

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Volume2, Check, Grid2X2, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Number, NumberProps } from "@/addons/learning/types";



const NumbersGridView = ({ lessonId, language = 'en' }: NumberProps) => {
    const [numbers, setNumbers] = useState<Number[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');

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

    const handleReviewToggle = async (id: number) => {
        try {
            const response = await fetch(
                `http://localhost:8000/api/v1/course/numbers/${id}/toggle_review/`,
                { method: 'POST' }
            );
            const data = await response.json();
            
            setNumbers(numbers.map(num =>
                num.id === id ? { ...num, is_reviewed: data.is_reviewed } : num
            ));
        } catch (error) {
            console.error('Error toggling review:', error);
        }
    };

    const filteredNumbers = numbers.filter(num => 
        num.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        num[`number_${language}`].toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedNumbers = {
        reviewed: filteredNumbers.filter(n => n.is_reviewed),
        unreviewed: filteredNumbers.filter(n => !n.is_reviewed)
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg"/>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    const NumberCard = ({ number }: { number: Number }) => (
        <Card
            className={`p-4 transition-all ${
                number.is_reviewed ? 'bg-green-50' : ''
            }`}
        >
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                    <span className="text-2xl font-bold">{number.number}</span>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => speak(number.number)}
                    >
                        <Volume2 className="h-4 w-4" />
                    </Button>
                </div>
                <div className="text-muted-foreground text-sm">
                    {number[`number_${language}`]}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReviewToggle(number.id)}
                    className={number.is_reviewed ? "bg-green-100" : ""}
                >
                    {number.is_reviewed ? (
                        <>
                            <Check className="w-4 h-4 mr-2" />
                            Known
                        </>
                    ) : (
                        "Mark as Known"
                    )}
                </Button>
            </div>
        </Card>
    );

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <div className="mb-6 space-y-4">
                {/* Header Controls */}
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'outline'}
                            onClick={() => setViewMode('grid')}
                            size="sm"
                        >
                            <Grid2X2 className="h-4 w-4 mr-2" />
                            Grid
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'outline'}
                            onClick={() => setViewMode('list')}
                            size="sm"
                        >
                            <List className="h-4 w-4 mr-2" />
                            List
                        </Button>
                    </div>
                    <input
                        type="search"
                        placeholder="Search numbers..."
                        className="px-4 py-2 border rounded-lg"
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                        <div className="text-sm text-muted-foreground">Known</div>
                        <div className="text-2xl font-bold">
                            {groupedNumbers.reviewed.length}/{numbers.length}
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-sm text-muted-foreground">To Learn</div>
                        <div className="text-2xl font-bold">
                            {groupedNumbers.unreviewed.length}
                        </div>
                    </Card>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="all">All Numbers</TabsTrigger>
                    <TabsTrigger value="known">Known</TabsTrigger>
                    <TabsTrigger value="to-learn">To Learn</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                    <div className={`grid gap-4 ${
                        viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'
                    }`}>
                        {filteredNumbers.map(number => (
                            <NumberCard key={number.id} number={number} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="known">
                    <div className={`grid gap-4 ${
                        viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'
                    }`}>
                        {groupedNumbers.reviewed.map(number => (
                            <NumberCard key={number.id} number={number} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="to-learn">
                    <div className={`grid gap-4 ${
                        viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'
                    }`}>
                        {groupedNumbers.unreviewed.map(number => (
                            <NumberCard key={number.id} number={number} />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default NumbersGridView;