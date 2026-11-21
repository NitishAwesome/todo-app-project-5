import { useState } from "react";
import TaskWorkspace from "./components/TaskWorkspace";
import TaskFormModal from "./components/TaskFormModal";

function App() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Open Add Task form
  const handleAdd = () => {
    setEditingTask(null);
    setFormOpen(true);
  };

  // Open Edit Task form
  const handleEdit = (task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  // Close the form
  const handleClose = () => {
    setFormOpen(false);
    setEditingTask(null);
  };

  // Refresh the task list after saving
  const handleSaved = () => {
    setRefreshKey((previous) => previous + 1);
  };

  return (
    <>
      <button onClick={handleAdd}>Add Task</button>

      <TaskWorkspace
        key={refreshKey}
        onEdit={handleEdit}
      />

      <TaskFormModal
        open={formOpen}
        mode={editingTask !== null ? "edit" : "add"}
        task={editingTask}
        onClose={handleClose}
        onSaved={handleSaved}
      />
    </>
  );
}

export default App;