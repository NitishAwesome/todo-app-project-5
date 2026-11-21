import TaskWorkspace from "./components/TaskWorkspace";

function App() {
  // Placeholder: the Add/Edit form owner will replace this with the real edit handler.
  const handleEdit = (task) => {
    console.log("Edit clicked for task:", task);
  };

  return <TaskWorkspace onEdit={handleEdit} />;
}

export default App;