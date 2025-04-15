// src/services/notebookAPI.ts
import apiClient from '@/core/api/apiClient';
import { Note, Category, Tag } from '@/addons/notebook/types';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const notesApi = {
  async getNotes(): Promise<Note[]> {
    const { data } = await apiClient.get<Note[]>(`${API_URL}/notebook/notes/`);
    return data;
  },

  async getNote(id: number): Promise<Note> {
    const { data } = await apiClient.get<Note>(`${API_URL}/notebook/notes/${id}/`);
    return data;
  },

  async createNote(noteData: Partial<Note>): Promise<Note> {
    const { data } = await apiClient.post<Note>(`${API_URL}/notebook/notes/`, noteData);
    return data;
  },

  async updateNote(noteData: Partial<Note> & { id: number }): Promise<Note> {
    const { id, ...rest } = noteData;
    const { data } = await apiClient.patch<Note>(`${API_URL}/notebook/notes/${id}/`, rest);
    return data;
  },

  async deleteNote(id: number): Promise<void> {
    await apiClient.delete(`${API_URL}/notebook/notes/${id}/`);
  },

  async getCategories(): Promise<Category[]> {
    const { data } = await apiClient.get<Category[]>(`${API_URL}/notebook/categories/`);
    return data;
  },

  async createCategory(categoryData: Partial<Category>): Promise<Category> {
    const { data } = await apiClient.post<Category>(`${API_URL}/notebook/categories/`, categoryData);
    return data;
  },

  async getTags(): Promise<Tag[]> {
    const { data } = await apiClient.get<Tag[]>(`${API_URL}/notebook/tags/`);
    return data;
  },

  async createTag(tagData: Partial<Tag>): Promise<Tag> {
    const { data } = await apiClient.post<Tag>(`${API_URL}/notebook/tags/`, tagData);
    return data;
  },

  async markNoteReviewed(id: number): Promise<Note> {
    const { data } = await apiClient.post<Note>(`${API_URL}/notebook/notes/${id}/mark_reviewed/`);
    return data;
  },

  async getDueForReview(): Promise<Note[]> {
    const { data } = await apiClient.get<Note[]>(`${API_URL}/notebook/notes/due_for_review/`);
    return data;
  },

  async getStatistics() {
    const { data } = await apiClient.get(`${API_URL}/notebook/notes/statistics/`);
    return data;
  }
};