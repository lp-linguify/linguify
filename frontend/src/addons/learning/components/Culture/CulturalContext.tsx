// src/addons/learning/components/Culture/CulturalContext.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, AlertCircle, MapPin, Cake, Globe, Book, ExternalLink } from "lucide-react";
import { CulturalContextProps } from "@/addons/learning/types";



export default function CulturalContext({ 
  languageCode, 
  lessonId, 
  theme 
}: CulturalContextProps) {
  // State for cultural content
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Map language codes to cultures/countries
  const languageCultures: Record<string, string[]> = {
    'en': ['United Kingdom', 'United States', 'Canada', 'Australia'],
    'fr': ['France', 'Canada (Quebec)', 'Belgium', 'Switzerland'],
    'es': ['Spain', 'Mexico', 'Argentina', 'Colombia'],
    'nl': ['Netherlands', 'Belgium (Flanders)']
  };
  
  // Map language codes to full names
  const languageNames: Record<string, string> = {
    'en': 'English',
    'fr': 'French',
    'es': 'Spanish',
    'nl': 'Dutch'
  };
  
  // Get cultural content
  useEffect(() => {
    async function fetchCulturalContent() {
      try {
        setLoading(true);
        
        // Fetch from API based on language and optionally lesson or theme
        const params: Record<string, string> = { language: languageCode };
        if (lessonId) params.lesson_id = lessonId;
        if (theme) params.theme = theme;
        
        const data = await cultureAPI.getCulturalContent(params);
        
        // If no specific content is found, fallback to general language culture
        if (!data || Object.keys(data).length === 0) {
          const generalContent = await cultureAPI.getLanguageCulture(languageCode);
          setContent(generalContent);
        } else {
          setContent(data);
        }
        
        setError(null);
      } catch (err) {
        console.error("Error fetching cultural content:", err);
        setError("Unable to load cultural content. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchCulturalContent();
  }, [languageCode, lessonId, theme]);
  
  // Loading state
  if (loading) {
    return (
      <div className="animate-pulse p-8 text-center">
        <p>Loading cultural insights...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  // No content
  if (!content) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No cultural content available for this lesson or language.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-400 text-white rounded-t-lg">
        <div>
          <h2 className="text-xl font-bold">Cultural Insights</h2>
          <p className="text-sm opacity-90">Discover the culture behind {languageNames[languageCode]}</p>
        </div>
        <Badge variant="outline" className="border-white text-white">
          <Globe className="h-3 w-3 mr-1" />
          {languageNames[languageCode]}
        </Badge>
      </CardHeader>
      
      <CardContent className="p-6">
        <Tabs defaultValue="overview">
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="customs">Customs</TabsTrigger>
            <TabsTrigger value="expressions">Expressions</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Basic cultural information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  Where it's spoken
                </h3>
                <div className="pl-7">
                  <ul className="list-disc space-y-1 pl-5">
                    {languageCultures[languageCode].map((country, i) => (
                      <li key={i}>{country}</li>
                    ))}
                  </ul>
                </div>
                
                {content.keyFacts && (
                  <>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Info className="h-5 w-5 text-purple-600" />
                      Key Facts
                    </h3>
                    <div className="pl-7">
                      <ul className="list-disc space-y-1 pl-5">
                        {content.keyFacts.map((fact: string, i: number) => (
                          <li key={i}>{fact}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
              
              {/* Map or flag image */}
              <div className="flex flex-col items-center justify-center p-4">
                <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden">
                  {/* This would be an actual image in production */}
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <Globe className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {languageNames[languageCode]}-speaking regions
                </p>
              </div>
            </div>
            
            {/* Cultural context description */}
            {content.culturalContext && (
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Cultural Context</h3>
                <p className="text-gray-700">{content.culturalContext}</p>
              </div>
            )}
          </TabsContent>
          
          {/* Customs Tab */}
          <TabsContent value="customs" className="space-y-6">
            {content.customs ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Cake className="h-5 w-5 text-purple-600" />
                  Social Customs
                </h3>
                
                {content.customs.map((custom: any, i: number) => (
                  <Card key={i} className="bg-gray-50 shadow-none">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-lg mb-2">{custom.title}</h4>
                      <p className="text-gray-700">{custom.description}</p>
                      
                      {custom.tips && (
                        <div className="mt-3 bg-white p-3 rounded-md border border-purple-100">
                          <h5 className="text-sm font-medium text-purple-700 mb-1">Cultural Tip</h5>
                          <p className="text-sm text-gray-600">{custom.tips}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertDescription>No customs information available.</AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          {/* Expressions Tab */}
          <TabsContent value="expressions" className="space-y-6">
            {content.expressions ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Book className="h-5 w-5 text-purple-600" />
                  Common Expressions
                </h3>
                
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Expression</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Translation</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Usage Context</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {content.expressions.map((item: any, i: number) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 text-sm font-medium">{item.expression}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{item.translation}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.context}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertDescription>No expressions information available.</AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6">
            {content.media ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-600" />
                  Media & Resources
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {content.media.map((item: any, i: number) => (
                    <Card key={i} className="overflow-hidden">
                      <div className="h-32 bg-gray-200 relative">
                        {/* This would be an actual image in production */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Globe className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-medium text-lg">{item.title}</h4>
                        <p className="text-sm text-gray-600 my-2">{item.description}</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Explore
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Alert>
                <AlertDescription>No media resources available.</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}