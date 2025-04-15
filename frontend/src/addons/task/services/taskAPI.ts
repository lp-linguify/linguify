// src/services/taskAPI.ts
import api from './api';

export interface Task {
  id: number;
  content: string;
  status: 0 | 1 | 2;
  created_at: string;
  updated_at: string;
}

export const taskAPI = {
  getTasks: async (filter?: string) => {
    try {
      const params = filter && filter !== 'all' ? { status: filter } : {};
      const response = await api.get<Task[]>('/api/v1/task/items/', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      throw error;
    }
  },

  createTask: async (content: string) => {
    try {
      const response = await api.post<Task>('/api/v1/task/items/', {
        content,
        status: 0
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  },

  updateTask: async (id: number, data: Partial<Task>) => {
    try {
      const response = await api.patch<Task>(`/api/v1/task/items/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  },

  deleteTask: async (id: number) => {
    try {
      await api.delete(`/api/v1/task/items/${id}/`);
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }
};