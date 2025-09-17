const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const Joi = require("joi");
const ModelTask = require("../models/model.task");
const ModelTaskComment = require("../models/model.taskComment");
const ModelInvoice = require("../models/model.invoice");
const ModelUser = require("../models/model.user");


//////////////////////////////////////////////////////////////////////////////////////
////TASKS ROUTES
//////////////////////////////////////////////////////////////////////////////////////

exports.CreateTask = useAsync(async (req, res) => {

    try {

        const accountType = req.userType
        const accountID = req.userId

        //create data if all data available
        const schema = Joi.object({
            title: Joi.string().min(3).required(),
            description: Joi.string().min(3).required(),
            user: Joi.string().required(),
            dueDate: Joi.string().min(1).required(),
        })

        //capture data
        const { taskName, task, dueDate, employee } = req.body;

        //validate data
        const validator = await schema.validateAsync(req.body);

        if (accountType === "user") {
            const user = await ModelUser.findOne({ _id: accountID })
            if (!user) {
                return res.status(400).json(utils.JParser('Invalid user, Try again later', false, []))
            }
            validator.admin = user.admin
        } else {
            validator.admin = accountID
        }

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

        const taskID = req.body.id
        const status = req.body.status

        if (!taskID) return res.status(402).json(utils.JParser('provide the tasks id', false, []));

        await ModelTask.updateOne({ _id: taskID }, { status }).then(async () => {
            const tasks = await ModelTask.find({ _id: taskID });
            return res.json(utils.JParser('Status changed update Successfully', !!tasks, tasks));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.getTasks = useAsync(async (req, res) => {
    try {
        const accountID = req.userId;
        const accountType = req.userType;

        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit === "all" ? null : parseInt(req.query.limit) || 10;
        const skip = req.query.limit === "all" ? 0 : (page - 1) * limit;

        let filter = {};
        if (accountType === "user") {
            filter = { user: accountID };
        } else if (accountType === "admin") {
            filter = { admin: accountID };
        }

        // 🔍 Add search (DB-level)
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, "i");
            filter.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { status: searchRegex },
            ];
        }

        let query = ModelTask.find(filter)
            .populate("user", "_id fullName")
            .populate("admin", "_id fullName")
            .sort({ createdAt: -1 })
            .lean();

        if (limit !== null) {
            query = query.skip(skip).limit(limit);
        }

        let tasks = await query.exec();

        // ✅ In-memory filter for populated fields (user/admin names)
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, "i");
            tasks = tasks.filter(
                (t) =>
                    searchRegex.test(t.title || "") ||
                    searchRegex.test(t.description || "") ||
                    searchRegex.test(t.status || "") ||
                    (t.user && searchRegex.test(t.user.fullName || "")) ||
                    (t.admin && searchRegex.test(t.admin.fullName || ""))
            );
        }

        // 🔢 Analytics
        const totalTasks = await ModelTask.countDocuments(filter);
        const totalPages = limit !== null ? Math.ceil(totalTasks / limit) : 1;

        const allTasks = await ModelTask.find(filter).lean();
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

        allTasks.forEach(task => {
            if (task.status && statusCounts.hasOwnProperty(task.status)) {
                statusCounts[task.status]++;
            }
        });

        const response = utils.JParser("Tasks fetched successfully", true, {
            tasks,
            analytics: {
                statusCounts,
                totalTasks
            },
            pagination: {
                currentPage: page,
                totalPages,
                totalTasks,
                tasksPerPage: limit,
                hasNextPage: limit !== null ? page < totalPages : false,
                hasPreviousPage: page > 1
            }
        });

        return res.json(response);
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});


exports.singleTask = useAsync(async (req, res) => {

    try {
        const taskID = req.params.id
        if (!taskID) return res.status(402).json(utils.JParser('provide the tasks id', false, []));

        const tasks = await ModelTask.findOne({ _id: taskID })
            .populate({
                path: 'user',
                select: '-password'
            })

        res.json(utils.JParser('Task fetch successfully', !!tasks, tasks));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})


exports.deleteTasks = useAsync(async (req, res) => {
    try {
        const taskID = req.body.id
        if (!taskID) return res.status(402).json(utils.JParser('provide the tasks id', false, []));

        const tasks = await ModelTask.findByIdAndUpdate(
            taskID,
            {
                isDeleted: false,
                updated_at: Date.now()
            },
            { new: true }
        );
        return res.json(utils.JParser('Tasks deleted successfully', !!tasks, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});


exports.tasksByStatus = useAsync(async (req, res) => {
    try {
        const { status } = req.params;
        const accountID = req.userId;
        const accountType = req.userType;

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const validStatuses = [
            "Pending", "Due", "Assigned", "Unconfirmed",
            "Completed", "Received", "Overdue", "To-Do", "Confirmed"
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json(utils.JParser("Invalid status provided", false, null));
        }

        // Build filter condition
        let filter = { status };
        if (accountType === "user") {
            filter.user = accountID;
        } else if (accountType === "admin") {
            filter.admin = accountID;
        }

        // Query tasks
        const tasks = await ModelTask.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("user", "_id fullName")
            .populate("admin", "_id fullName")
            .lean();

        const totalTasks = await ModelTask.countDocuments(filter);
        const totalPages = Math.ceil(totalTasks / limit);

        const response = utils.JParser(`Tasks with status ${status} fetched successfully`, true, {
            tasks,
            pagination: {
                currentPage: page,
                totalPages,
                totalTasks,
                tasksPerPage: limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });

        return res.json(response);
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});



//////////////////////////////////////////////////////////////////////////////////////
//// TASKS COMMENT  
//////////////////////////////////////////////////////////////////////////////////////
exports.taskComment = useAsync(async (req, res) => {

    try {
        const accountType = req.userType
        const accountID = req.userId

        //create data if all data available
        const schema = Joi.object({
            comment: Joi.string().min(2).required(),
            taskId: Joi.string().required()
        })

        //capture data
        const { comment, taskId } = req.body;

        //validate data
        const validator = await schema.validateAsync(req.body);
        validator.user = accountType === "user" ? accountID : null
        validator.admin = accountType === "admin" ? accountID : null
        validator.createBy = accountType === "admin" ? 2 : 1
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
            .populate("user", "_id fullName userRole")
            .populate("admin", "_id fullName userRole")
            .populate('task')

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
            .populate("user", "_id fullName userRole")
            .populate("admin", "_id fullName userRole")

        if (task) {
            const comments = await ModelTaskComment.find({ task: task._id })
                .populate("user", "_id fullName userRole")
                .populate("admin", "_id fullName userRole")

            res.json(utils.JParser('Task comment fetch successfully', !!task, { task, comments }));
        } else {
            res.json(utils.JParser('Task not found', false, []));

        }
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

