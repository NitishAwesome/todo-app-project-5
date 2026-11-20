const express = require('express');
const app = express();

const taskRoutes = require('./routes/taskRoutes');

app.use(express.json());

// Task API routes
app.use('/api/tasks', taskRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});