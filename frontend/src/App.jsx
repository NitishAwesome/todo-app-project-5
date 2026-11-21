import { useState } from "react";
import Layout from "./components/Layout";
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
    <Layout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1f2937", margin: 0 }}>My Tasks Board</h2>
          <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: "4px 0 0" }}>Manage, organize, and track your tasks</p>
        </div>
        <button className="btn" onClick={handleAdd}>+ Add Task</button>
      </div>

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
    </Layout>
  );
}

export default App;
