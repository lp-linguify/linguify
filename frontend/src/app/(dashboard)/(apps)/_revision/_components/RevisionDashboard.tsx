import React, { useState } from "react";
import {
  Brain,
  Book,
  Settings,
  Rotate3D as Rotate,
  BarChart2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import FlashcardApp from "../../../../../addons/flashcard/components/FlashCards";
import RevisionSchedule from "./RevisionSchedule";
import VocabularyManager from "./VocabularyManager";
import VocabularyRevision from "./VocabularyRevision";
import VocabularyStats from "./VocabularyStats";
import FlashcardList from "../../../../../addons/flashcard/components/FlashcardDeckList";

const tabItems = [
  {
    value: "practice",
    label: "Practice",
    icon: Rotate,
    component: VocabularyRevision,
  },
  {
    value: "flashcardlist",
    label: "Flashcard List",
    icon: Book,
    component: FlashcardList,
  },
  {
    value: "flashcards",
    label: "Flashcards",
    icon: Brain,
    component: FlashcardApp,
  },
  {
    value: "schedule",
    label: "Schedule",
    icon: Book,
    component: RevisionSchedule,
  },
  {
    value: "stats",
    label: "Stats",
    icon: BarChart2,
    component: VocabularyStats,
  },
  {
    value: "manage",
    label: "Manage",
    icon: Settings,
    component: VocabularyManager,
  },
];

const RevisionDashboard = () => {
  const [loading, setLoading] = useState(true);

  return (
    <div className="min-h-screen bg-background px-2 sm:px-4 md:px-6 lg:px-8 py-6">
      <Toaster />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
          <div className="relative space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Vocabulary Revision
            </h1>
            <p className="text-lg text-white/90 font-medium">
              Master your vocabulary through interactive flashcards and smart
              spaced repetition. Track your progress and learn efficiently.
            </p>
          </div>
        </div>

        {/* Navigation et Contenu */}
        <div className="bg-white rounded-lg shadow-lg">
          <Tabs defaultValue="practice" className="space-y-6">
            <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 border-b bg-gray-50/50">
              <TabsList className="grid w-full max-w-[1200px] grid-cols-3 md:grid-cols-5 gap-1 mx-auto bg-white/50 p-1 rounded-lg shadow-sm">
                {tabItems.map(({ value, label, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="
                      flex items-center justify-center gap-2 px-4 py-2.5
                      text-sm font-medium transition-all duration-200
                      data-[state=active]:bg-white data-[state=active]:text-indigo-600
                      data-[state=active]:shadow-sm hover:text-indigo-600
                      data-[state=active]:scale-[1.02]
                      rounded-md
                    "
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="px-3 sm:px-4 md:px-6 lg:px-8 pb-6">
              {tabItems.map(({ value, component: Component }) => (
                <TabsContent
                  key={value}
                  value={value}
                  className="focus-visible:outline-none focus-visible:ring-0 space-y-6"
                >
                  <Component />
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default RevisionDashboard;
