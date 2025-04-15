'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Upload, Search, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectValue, Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';

interface Word {
  id: string;
  word: string;
  translation: string;
  source_language: string;
  target_language: string;
  context?: string;
  notes?: string;
}

interface Language {
  code: string;
  label: string;
}

const LANGUAGES: Language[] = [
  { code: 'EN', label: 'English' },
  { code: 'FR', label: 'French' },
  { code: 'ES', label: 'Spanish' },
  { code: 'DE', label: 'German' }
];

const VocabularyManager = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [isAddingWord, setIsAddingWord] = useState(false);
  const [newWord, setNewWord] = useState<Word>({
    id: '', // Will be set by the server
    word: '',
    translation: '',
    source_language: 'EN',
    target_language: 'FR',
    context: '',
    notes: ''
  });
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWords();
  }, []);

  const fetchWords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/revision/vocabulary/');
      if (!response.ok) throw new Error('Failed to fetch words');
      const data = await response.json();
      setWords(data as Word[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch('/api/v1/revision/vocabulary/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWord),
      });
      
      if (!response.ok) throw new Error('Failed to add word');
      
      setSuccess('Word added successfully!');
      setIsAddingWord(false);
      setNewWord({
        id: '',
        word: '',
        translation: '',
        source_language: 'EN',
        target_language: 'FR',
        context: '',
        notes: ''
      });
      fetchWords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleImportExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_language', 'EN');
    formData.append('target_language', 'FR');

    try {
      setLoading(true);
      const response = await fetch('/api/v1/revision/vocabulary/import_excel/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to import file');
      
      const data = await response.json();
      setSuccess(data.message);
      fetchWords();
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredWords = words.filter(word => 
    word.word.toLowerCase().includes(filter.toLowerCase()) ||
    word.translation.toLowerCase().includes(filter.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vocabulary Manager</h1>
        <p className="mt-2 text-gray-600">Manage and review your vocabulary words</p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Add Word Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Add New Word
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setIsAddingWord(!isAddingWord)}
              className="w-full"
              variant={isAddingWord ? "secondary" : "default"}
            >
              {isAddingWord ? 'Cancel' : 'Add Word'}
            </Button>

            {isAddingWord && (
              <form onSubmit={handleAddWord} className="mt-4 space-y-4">
                <Input
                  value={newWord.word}
                  onChange={(e) => setNewWord({...newWord, word: e.target.value})}
                  placeholder="Word"
                  required
                />
                <Input
                  value={newWord.translation}
                  onChange={(e) => setNewWord({...newWord, translation: e.target.value})}
                  placeholder="Translation"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={newWord.source_language}
                    onValueChange={(value) => setNewWord({...newWord, source_language: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Source Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={newWord.target_language}
                    onValueChange={(value) => setNewWord({...newWord, target_language: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Target Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  value={newWord.context || ''}
                  onChange={(e) => setNewWord({...newWord, context: e.target.value})}
                  placeholder="Context (optional)"
                />
                <textarea
                  value={newWord.notes || ''}
                  onChange={(e) => setNewWord({...newWord, notes: e.target.value})}
                  placeholder="Notes (optional)"
                  className="w-full p-2 border rounded"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  variant="default"
                >
                  {loading ? 'Adding...' : 'Save Word'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Import Excel Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              Import from Excel/CSV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleImportExcel} className="space-y-4">
              <div className="border-2 border-dashed rounded-md p-4">
                <Input
                  type="file"
                  onChange={handleFileChange}
                  accept=".xlsx,.csv"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Upload .xlsx or .csv file with columns: word, translation
                </p>
              </div>
              <Button
                type="submit"
                disabled={!file || loading}
                className="w-full"
                variant="default"
              >
                {loading ? 'Importing...' : 'Import Words'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Words List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Search className="mr-2 h-5 w-5" />
              Vocabulary List
            </div>
            <div className="relative">
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search words..."
                className="pl-8"
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-4 text-left">Word</th>
                  <th className="p-4 text-left">Translation</th>
                  <th className="p-4 text-left">Context</th>
                  <th className="p-4 text-left">Notes</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center p-4">Loading...</td>
                  </tr>
                ) : filteredWords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-4">No words found</td>
                  </tr>
                ) : (
                  filteredWords.map((word) => (
                    <tr key={word.id} className="border-t">
                      <td className="p-4">{word.word}</td>
                      <td className="p-4">{word.translation}</td>
                      <td className="p-4">{word.context || '-'}</td>
                      <td className="p-4">{word.notes || '-'}</td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" className="hover:text-blue-600">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VocabularyManager;