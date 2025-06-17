/**
 * 
 */
const {authMiddleware, roleMiddleware} = require('../middleware/middleware.protects');

const express = require('express');
const router = express.Router();
const CoreError = require('../core/core.error');
const { getTasks, singleTask, taskComment, singleTaskComment, taskComments, changeTaskStatus, tasksByStatus } = require('../controller/controller.task');
const { getEmployee } = require('../controller/controller.employee');
const { useAsync } = require('../core');

/**
 * Export lastly
 */

////TASKS
router.get('/my/tasks', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), getTasks );
router.get('/task/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), singleTask );
router.put('/task/status/update/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), changeTaskStatus );
router.get('/tasks/status/:status', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), tasksByStatus );

//TASKS COMMENT
router.post('/task/comment', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), taskComment );
router.get('/single/comment/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), singleTaskComment );
router.get('/task/comment/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), taskComments );


router.all('/*', (req, res) => {
    throw new CoreError(`route not found ${req.originalUrl} using ${req.method} method`, 404);
})

module.exports = router;
