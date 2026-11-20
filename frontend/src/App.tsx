import Layout from "./components/Layout";

function App() {
  return (
    <Layout>
      <div className="card">
        <h2>Welcome to the To-Do App</h2>
        <p>
          This is the main content area. Your teammates' screens will appear
          here.
        </p>
        <button className="btn">Add Task</button>
      </div>
    </Layout>
  );
}

export default App