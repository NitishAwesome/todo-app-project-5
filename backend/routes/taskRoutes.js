const express = require('express');
const router = express.Router();

const {
    createTask,
    getTasks,
    updateTask,
    deleteTask
} = require('../controllers/taskController');

// CREATE - POST
router.post('/', createTask);

// READ - GET
router.get('/', getTasks);

// UPDATE - PUT
router.put('/:id', updateTask);

// DELETE - DELETE
router.delete('/:id', deleteTask);

module.exports = router;