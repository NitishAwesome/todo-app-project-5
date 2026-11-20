function Navbar() {
  return (
    <header className="navbar">
      <h1 className="navbar-logo">To-Do App</h1>
      <nav className="navbar-links">
        <a href="#dashboard">Dashboard</a>
        <a href="#tasks">Tasks</a>
        <a href="#add-task">Add Task</a>
      </nav>
    </header>
  );
}

export default Navbar;