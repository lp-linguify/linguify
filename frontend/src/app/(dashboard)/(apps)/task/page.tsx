// src/app/(dashboard)/(apps)/task/page.tsx
import { Metadata } from 'next';
import TaskManager from '../../../../addons/task/components/TaskManager';

export const metadata: Metadata = {
  title: 'Tasks | Linguify',
  description: 'Manage your tasks and track your progress',
};

export default function TaskPage() {
  return <TaskManager />;
}