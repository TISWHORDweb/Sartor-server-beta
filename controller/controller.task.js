const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const Joi = require("joi");
const ModelTask = require("../models/model.task");
const ModelTaskComment = require("../models/model.taskComment");


//////////////////////////////////////////////////////////////////////////////////////
////ADMIN TASKS ROUTES
//////////////////////////////////////////////////////////////////////////////////////

exports.CreateTask = useAsync(async (req, res) => {

    try {

        const adminId = req.userId

        //create data if all data available
        const schema = Joi.object({
            title: Joi.string().min(3).required(),
            description: Joi.string().min(3).required(),
            employee: Joi.string().required(),
            dueDate: Joi.string().min(1).required(),
        })

        //capture data
        const { taskName, task, dueDate, employee } = req.body;

        //validate data
        const validator = await schema.validateAsync(req.body);

        validator.admin = adminId

        const tasks = await ModelTask.create(validator)
        return res.json(utils.JParser('Tasks created successfully', !!tasks, tasks));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

})

exports.editTask = useAsync(async (req, res) => {

    try {

        const taskID = req.body.id
        const body = req.body

        if (!taskID) return res.status(402).json(utils.JParser('provide the tasks id', false, []));

        await ModelTask.updateOne({ _id: taskID }, body).then(async () => {
            const tasks = await ModelTask.find({ _id: taskID });
            return res.json(utils.JParser('Task update Successfully', !!tasks, tasks));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.changeTaskStatus = useAsync(async (req, res) => {

    try {

        const taskID = req.params.id
        const status = req.body.status

        if (!taskID) return res.status(402).json(utils.JParser('provide the tasks id', false, []));

        await ModelTask.updateOne({ _id: taskID }, {status}).then(async () => {
            const tasks = await ModelTask.find({ _id: taskID });
            return res.json(utils.JParser('Status changed update Successfully', !!tasks, tasks));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.getTasks = useAsync(async (req, res) => {

    try {

        const userId = req.userId

        const tasks = await ModelTask.find({ employee: userId })
            .populate('admin')
            .populate('employee');


        // Calculate status counts
        const statusCounts = {
            "Pending": 0,
            "Due": 0,
            "Assigned": 0,
            "Unconfirmed": 0,
            "Completed": 0,
            "Received": 0,
            "Overdue": 0,
            "To-Do": 0,
            "Confirmed": 0
        };

        tasks.forEach(task => {
            if (task.status && statusCounts.hasOwnProperty(task.status)) {
                statusCounts[task.status]++;
            }
        });

        // Prepare response with both tasks and analytics
        const response = {
            tasks: tasks,
            analytics: {
                statusCounts: statusCounts,
                totalTasks: tasks.length
            }
        };

        return res.json(utils.JParser('Task fetch successfully', true, response));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.allTasks = useAsync(async (req, res) => {
    try {
        // Get all tasks
        const tasks = await ModelTask.find()
            .populate('admin')
            .populate('employee');

        // Calculate status counts
        const statusCounts = {
            "Pending": 0,
            "Due": 0,
            "Assigned": 0,
            "Unconfirmed": 0,
            "Completed": 0,
            "Received": 0,
            "Overdue": 0,
            "To-Do": 0,
            "Confirmed": 0
        };

        tasks.forEach(task => {
            if (task.status && statusCounts.hasOwnProperty(task.status)) {
                statusCounts[task.status]++;
            }
        });

        // Prepare response with both tasks and analytics
        const response = {
            tasks: tasks,
            analytics: {
                statusCounts: statusCounts,
                totalTasks: tasks.length
            }
        };

        return res.json(utils.JParser('Tasks fetched successfully', true, response));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

exports.singleTask = useAsync(async (req, res) => {

    try {
        const taskID = req.params.id
        if (!taskID) return res.status(402).json(utils.JParser('provide the tasks id', false, []));

        const tasks = await ModelTask.findOne({ _id: taskID })
            .populate('admin').populate('employee')

        res.json(utils.JParser('Task fetch successfully', !!tasks, tasks));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})


exports.deleteAdminTasks = useAsync(async (req, res) => {
    try {
        const taskID = req.body.id
        if (!taskID) return res.status(402).json(utils.JParser('provide the tasks id', false, []));

        const tasks = await ModelTask.deleteOne({ _id: taskID })
        return res.json(utils.JParser('Tasks deleted successfully', !!tasks, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});

exports.getTaskByStatus = useAsync(async (req, res) => {

    try {

        const status = req.params.status
        const adminID = req.adminID

        if (status) {
            const tasks = await ModelTask.find({ status: status });
            if (tasks) {
                return res.json(utils.JParser('TaskS fetch successfully', !!tasks, tasks));
            } else {
                return res.status(402).json(utils.JParser('Invalid status', !!tasks, []));
            }
        } else {
            return res.status(402).json(utils.JParser('Task not found', !!tasks, []));
        }

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

//////////////////////////////////////////////////////////////////////////////////////
//// TASKS COMMENT  
//////////////////////////////////////////////////////////////////////////////////////
exports.taskComment = useAsync(async (req, res) => {

    try {
        const userId = req.userId
        const who = req.who

        //create data if all data available
        const schema = Joi.object({
            comment: Joi.string().min(2).required(),
            taskId: Joi.string().required()
        })

        //capture data
        const { comment, taskId } = req.body;

        //validate data
        const validator = await schema.validateAsync(req.body);
        validator.admin = who === 2 ? userId : null
        validator.employee = who === 1 ? userId : null
        validator.createBy = who
        validator.task = taskId

        const tasks = await ModelTaskComment.create(validator)
        return res.json(utils.JParser('Task comment created successfully', !!tasks, tasks));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

})

exports.singleTaskComment = useAsync(async (req, res) => {

    try {
        const comment = req.params.id
        if (!comment) return res.status(402).json(utils.JParser('provide the comment id', false, []));

        const tasks = await ModelTaskComment.findOne({ _id: comment })
            .populate('admin').populate('employee').populate('task')

        res.json(utils.JParser('Comment fetch successfully', !!tasks, tasks));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.taskComments = useAsync(async (req, res) => {

    try {
        const taskID = req.params.id
        if (!taskID) return res.status(402).json(utils.JParser('provide the task id', false, []));

        const task = await ModelTask.findOne({ _id: taskID })
            .populate('employee')

        const comments = await ModelTaskComment.find({ task: task.id })
            .populate('admin').populate('employee')

        res.json(utils.JParser('Task comment fetch successfully', !!task, { task, comments }));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})