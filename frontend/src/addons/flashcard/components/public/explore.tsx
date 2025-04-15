// src/addons/flashcard/components/ExplorePage.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useRouter, useSearchParams } from 'next/navigation';

import { 
  ChevronLeft, 
  Globe, 
  ThumbsUp, 
  Clock
} from 'lucide-react';

import PublicDeckExplorer from '@/addons/flashcard/components/public/PublicDeckExplorer';
import PublicDeckDetail from '@/addons/flashcard/components/public/PublicDeckDetail';

const ExplorePage = () => {
  const router = useRouter();
  const { toast } = useToast();
  
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('explore');
  
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && !isNaN(Number(id))) {
      setSelectedDeckId(Number(id));
    }
  }, [searchParams]);
  
  const handleBackToList = () => {
    setSelectedDeckId(null);
    router.push('/flashcard/explore');
  };
  
  const handleDeckClone = () => {
    router.push('/flashcard');
    
    toast({
      title: "Succès",
      description: "Deck ajouté à votre bibliothèque",
    });
  };
  
  if (selectedDeckId) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <PublicDeckDetail
          deckId={selectedDeckId}
          onGoBack={handleBackToList}
          onClone={handleDeckClone}
        />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/flashcard')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Retour à mes decks
            </Button>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-purple to-brand-gold bg-clip-text text-transparent">
            Explorer
          </h1>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 max-w-md mb-6">
          <TabsTrigger value="explore">
            <Globe className="h-4 w-4 mr-2" />
            Explorer
          </TabsTrigger>
          <TabsTrigger value="popular">
            <ThumbsUp className="h-4 w-4 mr-2" />
            Populaires
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Clock className="h-4 w-4 mr-2" />
            Récents
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="explore">
          <PublicDeckExplorer
            onDeckClone={handleDeckClone}
          />
        </TabsContent>
        
        <TabsContent value="popular">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Decks Populaires</h2>
            <p className="text-gray-600">
              Découvrez les decks les plus appréciés par la communauté
            </p>
            <PublicDeckExplorer
              onDeckClone={handleDeckClone}
              initialTab="popular"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="recent">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Decks Récents</h2>
            <p className="text-gray-600">
              Jetez un œil aux derniers decks créés
            </p>
            <PublicDeckExplorer
              onDeckClone={handleDeckClone}
              initialTab="recent"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExplorePage;