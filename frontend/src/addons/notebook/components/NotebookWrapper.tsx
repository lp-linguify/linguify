// Original path: frontend/src/app/dashboard/apps/notebook/_components/NotebookWrapper.tsx
"use client";
"use client";

import React, { useState } from "react";
import NotebookClient from "./NotebookClient";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Filter, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { notebookAPI } from "@/addons/notebook/api/notebookAPI";

export default function NotebookWrapper() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    note_type: "NOTE",
    priority: "MEDIUM",
  });

  const handleCreateNote = async () => {
    try {
      await notebookAPI.createNote(newNote);
      setNewNote({
        title: "",
        content: "",
        note_type: "NOTE",
        priority: "MEDIUM",
      });
      setIsDialogOpen(false);
      // Vous pourriez vouloir rafraîchir la liste des notes ici
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search, Filter, and Create Bar */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <Input
            type="text"
            placeholder="Search notes..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={20} />
              Create Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  placeholder="Note Title"
                  value={newNote.title}
                  onChange={(e) =>
                    setNewNote({ ...newNote, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Textarea
                  placeholder="Note Content"
                  className="min-h-[200px]"
                  value={newNote.content}
                  onChange={(e) =>
                    setNewNote({ ...newNote, content: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateNote}>Create Note</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <button className="p-2 hover:bg-gray-100 rounded">
          <Filter size={20} />
        </button>
      </div>

      <Tabs
        defaultValue="all"
        className="w-full"
        onValueChange={setActiveFilter}
      >
        <TabsList>
          <TabsTrigger value="all">All Notes</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <NotebookClient searchTerm={searchTerm} filter={activeFilter} />
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <NotebookClient searchTerm={searchTerm} filter="recent" />
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          <NotebookClient searchTerm={searchTerm} filter="favorites" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
