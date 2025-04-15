// src/addons/learning/components/main.tsx
'use client';
import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import { 
  Book, 
  HelpCircle, 
  MessageSquare, 
  Video, 
  List,
  Send,  
  ChevronRight,
  PlayCircle,
  FileText,
  Users,
  Lightbulb
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Tutorial, FAQItem } from "@/addons/help/types/";

const tutorials: Tutorial[] = [
  {
    id: 1,
    title: "Débuter avec Linguify",
    description: "Guide complet pour commencer votre apprentissage",
    icon: <Book className="text-blue-500" />,
    videoUrl: "https://exemple.com/tutoriel-debut"
  },
  {
    id: 2,
    title: "Créer des flashcards efficaces",
    description: "Apprenez à construire des cartes mémoire puissantes",
    icon: <List className="text-green-500" />,
    videoUrl: "https://exemple.com/flashcards-tutoriel"
  },
  {
    id: 3,
    title: "Techniques d'apprentissage avancées",
    description: "Maximisez votre potentiel d'apprentissage",
    icon: <Lightbulb className="text-yellow-500" />,
    videoUrl: "https://exemple.com/techniques-avancees"
  }
];

const faqs: FAQItem[] = [
  {
    id: 1,
    question: "Comment créer un deck de flashcards ?",
    answer: "Rendez-vous dans la section Flashcards, cliquez sur 'Nouvelle liste', puis ajoutez vos cartes manuellement ou importez-les via un fichier Excel."
  },
  {
    id: 2,
    question: "Puis-je partager mes decks ?",
    answer: "Oui ! Dans les paramètres de votre deck, vous pouvez le rendre public et le partager avec la communauté Linguify."
  }
];

export default function HelpCenter() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('tutorials');
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleFeedbackSubmit = async () => {
    if (!feedbackForm.name || !feedbackForm.email || !feedbackForm.message) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    try {
      // Simulation d'envoi de feedback
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Succès",
        description: "Votre feedback a été envoyé. Merci !",
      });

      // Réinitialiser le formulaire
      setFeedbackForm({ name: '', email: '', message: '' });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le feedback",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-purple to-brand-gold bg-clip-text text-transparent">
            Centre d'Aide Linguify
          </h1>
          <p className="text-gray-600 mt-2">
            Trouvez des réponses, des tutoriels et partagez vos retours
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push("/")}
        >
          <ChevronRight className="mr-2" /> Retour à l'accueil
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 max-w-xl mx-auto mb-6">
          <TabsTrigger value="tutorials">
            <Video className="mr-2" /> Tutoriels
          </TabsTrigger>
          <TabsTrigger value="faq">
            <HelpCircle className="mr-2" /> FAQ
          </TabsTrigger>
          <TabsTrigger value="feedback">
            <MessageSquare className="mr-2" /> Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tutorials">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tutorials.map(tutorial => (
              <Card key={tutorial.id} className="hover:shadow-lg transition-all">
                <CardHeader className="flex flex-row items-center space-x-4">
                  {tutorial.icon}
                  <CardTitle>{tutorial.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{tutorial.description}</p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(tutorial.videoUrl, '_blank')}
                  >
                    <PlayCircle className="mr-2" /> Voir le tutoriel
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="faq">
          <div className="space-y-4">
            {faqs.map(faq => (
              <Card key={faq.id} className="hover:bg-gray-50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
            <div className="text-center mt-6">
              <p className="text-gray-500">
                Vous n'avez pas trouvé de réponse ? 
                <Button variant="link">Contactez notre support</Button>
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="feedback">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Partagez votre retour</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Nom</label>
                  <Input 
                    placeholder="Votre nom"
                    value={feedbackForm.name}
                    onChange={(e) => setFeedbackForm({...feedbackForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label>Email</label>
                  <Input 
                    placeholder="Votre email"
                    type="email"
                    value={feedbackForm.email}
                    onChange={(e) => setFeedbackForm({...feedbackForm, email: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label>Message</label>
                <Textarea 
                  placeholder="Votre message, suggestion ou rapport de bug"
                  rows={5}
                  value={feedbackForm.message}
                  onChange={(e) => setFeedbackForm({...feedbackForm, message: e.target.value})}
                />
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-brand-purple to-brand-gold"
                onClick={handleFeedbackSubmit}
              >
                <Send className="mr-2" /> Envoyer mon feedback
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-center text-gray-500 mt-10">
        <p>Besoin d'aide supplémentaire ?</p>
        <div className="flex justify-center space-x-4 mt-4">
          <Button variant="outline">
            <Users className="mr-2" /> Communauté
          </Button>
          <Button variant="outline">
            <FileText className="mr-2" /> Documentation
          </Button>
        </div>
      </div>
    </div>
  );
}