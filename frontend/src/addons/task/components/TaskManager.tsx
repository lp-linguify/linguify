"use client";
import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle,
  Circle,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";

interface Task {
  id: number;
  content: string;
  status: 0 | 1 | 2; // 0: TODO, 1: WIP, 2: DONE
  created_at: string;
  updated_at: string;
}

const TaskManager = () => {
  const { getAccessToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getAccessToken();
      const params = filter !== "all" ? `?status=${filter}` : "";

      const response = await fetch(
        `http://localhost:8000/api/v1/task/items/${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError("Failed to load tasks. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;

    try {
      setError(null);
      const token = await getAccessToken();

      const response = await fetch("http://localhost:8000/api/v1/task/items/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newTask,
          status: 0,
        }),
      });

      if (!response.ok) throw new Error("Failed to add task");

      const task = await response.json();
      setTasks([...tasks, task]);
      setNewTask("");
    } catch (error) {
      console.error("Error adding task:", error);
      setError("Failed to add task. Please try again.");
    }
  };

  const handleUpdateTask = async (task: Task) => {
    try {
      setError(null);
      const token = await getAccessToken();

      const response = await fetch(
        `http://localhost:8000/api/v1/task/items/${task.id}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(task),
        }
      );

      if (!response.ok) throw new Error("Failed to update task");

      const updatedTask = await response.json();
      setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
      setEditingTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
      setError("Failed to update task. Please try again.");
    }
  };

  const handleDeleteTask = async (task: Task) => {
    try {
      setError(null);
      const token = await getAccessToken();

      const response = await fetch(
        `http://localhost:8000/api/v1/task/items/${task.id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete task");

      setTasks(tasks.filter((t) => t.id !== task.id));
      setTaskToDelete(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Failed to delete task. Please try again.");
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Todo
          </Badge>
        );
      case 1:
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            In Progress
          </Badge>
        );
      case 2:
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Done
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 0:
        return <Circle className="h-4 w-4 text-yellow-500" />;
      case 1:
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 2:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="0">Todo</SelectItem>
            <SelectItem value="1">In Progress</SelectItem>
            <SelectItem value="2">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Add a new task"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
        />
        <Button onClick={handleAddTask}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tasks found. Create a new task to get started.
            </div>
          ) : (
            tasks.map((task) => (
              <Card key={task.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(task.status)}
                    {editingTask?.id === task.id ? (
                      <Input
                        value={editingTask.content}
                        onChange={(e) =>
                          setEditingTask({
                            ...editingTask,
                            content: e.target.value,
                          })
                        }
                        className="flex-1"
                      />
                    ) : (
                      <span className="flex-1">{task.content}</span>
                    )}
                    {getStatusBadge(task.status)}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {editingTask?.id === task.id ? (
                      <>
                        <Select
                          value={String(editingTask.status)}
                          onValueChange={(value) =>
                            setEditingTask({
                              ...editingTask,
                              status: Number(value) as Task["status"],
                            })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Todo</SelectItem>
                            <SelectItem value="1">In Progress</SelectItem>
                            <SelectItem value="2">Done</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => handleUpdateTask(editingTask)}
                          variant="outline"
                          size="sm"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => setEditingTask(null)}
                          variant="ghost"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTask(task)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTaskToDelete(task);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the task. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => taskToDelete && handleDeleteTask(taskToDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TaskManager;
