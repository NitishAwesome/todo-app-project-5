const db = require('../config/db');

// CREATE TASK - POST
const createTask = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const {
            title,
            description,
            status,
            priority,
            due_date,
            category_id
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: 'Task title is required'
            });
        }

        const validStatuses = ['Pending', 'InProgress', 'Completed'];
        const validPriorities = ['Low', 'Medium', 'High'];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        if (priority && !validPriorities.includes(priority)) {
            return res.status(400).json({ message: 'Invalid priority' });
        }

        const sql = `
            INSERT INTO tasks
            (user_id, category_id, title, description, status, priority, due_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.execute(sql, [
            userId,
            category_id || null,
            title.trim(),
            description || null,
            status || 'Pending',
            priority || 'Medium',
            due_date || null
        ]);

        const [tasks] = await db.execute(
            'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
            [result.insertId, userId]
        );

        res.status(201).json({
            message: 'Task created successfully',
            task: tasks[0]
        });

    } catch (error) {
        console.error(error);

        if (error.errno === 1452) {
            return res.status(400).json({
                message: 'Invalid category'
            });
        }

        res.status(500).json({ message: 'Server error' });
    }
};


// GET ALL TASKS - GET
const getTasks = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const [tasks] = await db.execute(
            'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        res.status(200).json({
            message: 'Tasks fetched successfully',
            tasks
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


// UPDATE TASK - PUT
const updateTask = async (req, res) => {
    try {
        const userId = req.user?.id;
        const taskId = req.params.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const [existingTasks] = await db.execute(
            'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
            [taskId, userId]
        );

        if (existingTasks.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const oldTask = existingTasks[0];
        const { title, description, status, priority, due_date, category_id } = req.body;

        const updatedTitle = title === undefined ? oldTask.title : title;
        const updatedStatus = status === undefined ? oldTask.status : status;
        const updatedPriority = priority === undefined ? oldTask.priority : priority;

        if (typeof updatedTitle !== 'string' || !updatedTitle.trim()) {
            return res.status(400).json({ message: 'Valid title is required' });
        }

        if (!['Pending', 'InProgress', 'Completed'].includes(updatedStatus)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        if (!['Low', 'Medium', 'High'].includes(updatedPriority)) {
            return res.status(400).json({ message: 'Invalid priority' });
        }

        await db.execute(
            `UPDATE tasks
             SET title = ?, description = ?, status = ?,
                 priority = ?, due_date = ?, category_id = ?
             WHERE id = ? AND user_id = ?`,
            [
                updatedTitle.trim(),
                description === undefined ? oldTask.description : description,
                updatedStatus,
                updatedPriority,
                due_date === undefined ? oldTask.due_date : due_date,
                category_id === undefined ? oldTask.category_id : category_id,
                taskId,
                userId
            ]
        );

        const [updatedTasks] = await db.execute(
            'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
            [taskId, userId]
        );

        res.status(200).json({
            message: 'Task updated successfully',
            task: updatedTasks[0]
        });

    } catch (error) {
        console.error(error);
        res.status(error.errno === 1452 ? 400 : 500).json({
            message: error.errno === 1452 ? 'Invalid category' : 'Server error'
        });
    }
};


// DELETE TASK - DELETE
const deleteTask = async (req, res) => {
    try {
        const userId = req.user?.id;
        const taskId = req.params.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const [result] = await db.execute(
            'DELETE FROM tasks WHERE id = ? AND user_id = ?',
            [taskId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({
            message: 'Task deleted successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


module.exports = {
    createTask,
    getTasks,
    updateTask,
    deleteTask
};