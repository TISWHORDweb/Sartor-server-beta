const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const Joi = require("joi");
const ModelTask = require("../models/model.task");


//////////////////////////////////////////////////////////////////////////////////////
////ADMIN TASKS ROUTES
//////////////////////////////////////////////////////////////////////////////////////

exports.AdminCreateTask = useAsync(async (req, res) => {

    try {

        const adminID = req.adminID

        //create data if all data available
        const schema = Joi.object({
            taskName: Joi.string().min(1).required(),
            task: Joi.string().min(1).required(),
            taskFor: Joi.number().min(1).required(),
            quantity: Joi.number().min(1).required(),
        })

        //capture data
        const { taskName, task, taskFor, quantity } = req.body;

        //validate data
        const validator = await schema.validateAsync(req.body);

        validator.adminID = adminID
        validator.createBy = 2

        const tasks = await ModelTask.create(validator)
        return res.json(utils.JParser('Tasks created successfully', !!tasks, tasks));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

})

exports.editAdminTasks = useAsync(async (req, res) => {

    try {

        const taskID = req.body.id
        const body = req.body

        if (!taskID) return res.status(402).json(utils.JParser('provide the tasks id', false, []));

        await ModelTask.updateOne({ _id: taskID, createBy: 2 }, body).then(async () => {
            const tasks = await ModelTask.find({ _id: taskID });
            return res.json(utils.JParser('Task update Successfully', !!tasks, tasks));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.getAdminTasks = useAsync(async (req, res) => {

    try {

        const adminID = req.adminID

        const tasks = await ModelTask.find({ adminID: adminID });
        return res.json(utils.JParser('Task fetch successfully', !!tasks, tasks));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.singleAdminTask = useAsync(async (req, res) => {

    try {
        const taskID = req.params.id
        if (!taskID) return res.status(402).json(utils.JParser('provide the tasks id', false, []));

        const tasks = await ModelTask.findOne({ _id: taskID });

        res.json(utils.JParser('Task fetch successfully', !!tasks, tasks));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.allAdminTasks = useAsync(async (req, res) => {

    try {
        const tasks = await ModelTask.find();
        return res.json(utils.JParser('All Products fetch successfully', !!tasks, tasks));
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

exports.getAdminTaskByStatus = useAsync(async (req, res) => {

    try {

        const status = req.params.status
        const adminID = req.adminID

        if (status) {
            const tasks = await ModelTask.find({ status: status, adminID: adminID });
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
////AGENT TASKS ROUTES
//////////////////////////////////////////////////////////////////////////////////////

exports.AgentCreateTask = useAsync(async (req, res) => {

    try {

        const salesAgentID = req.salesAgentID

        //create data if all data available
        const schema = Joi.object({
            taskName: Joi.string().min(1).required(),
            task: Joi.string().min(1).required(),
            quantity: Joi.number().min(1).required(),
        })

        //capture data
        const { taskName, task, taskFor, quantity } = req.body;

        //validate data
        const validator = await schema.validateAsync(req.body);

        validator.salesAgentID = salesAgentID
        validator.createBy = 1
        validator.taskFor = 1

        const tasks = await ModelTask.create(validator)
        return res.json(utils.JParser('Tasks created successfully', !!tasks, tasks));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

})

exports.editAgentTasks = useAsync(async (req, res) => {

    try {
        const salesAgentID = req.salesAgentID
        
        const taskID = req.body.id
        const body = req.body

        if (!taskID) return res.status(402).json(utils.JParser('provide the tasks id', false, []));

        const option = { _id: taskID, salesAgentID: salesAgentID, createBy: 1 }
        const check = await ModelTask.findOne(option)

        if (check) {
            await ModelTask.updateOne(option, body).then(async () => {
                const tasks = await ModelTask.find(option);
                return res.json(utils.JParser('Task update Successfully', !!tasks, tasks));
            })
        } else {
            return res.json(utils.JParser("Tasks not found or you are not authorized", !!tasks, []));
        }

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.getAgentTasks = useAsync(async (req, res) => {

    try {

        const salesAgentID = req.salesAgentID

        const ByAdmin = await ModelTask.find({ salesAgentID: salesAgentID, createBy: 2 });
        const ForAllAgent = await ModelTask.find({ taskFor: 2 });
        const AssignedToSelf = await ModelTask.find({ createBy: 1, salesAgentID: salesAgentID });

        return res.json(utils.JParser('Task fetch successfully', !!ByAdmin || !!ForAllAgent || !!AssignedToSelf, { ByAdmin, ForAllAgent, AssignedToSelf }));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.singleAgentTask = useAsync(async (req, res) => {

    try {
        const taskID = req.params.id
        if (!taskID) return res.status(402).json(utils.JParser('provide the tasks id', false, []));

        const tasks = await ModelTask.findOne({ _id: taskID});

        if (!tasks) return res.status(402).json(utils.JParser('No tasks have that kind of id ', false, []));

        res.json(utils.JParser('Task fetch successfully', !!tasks, tasks));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteAgentTasks = useAsync(async (req, res) => {
    try {

        const salesAgentID = req.salesAgentID

        const taskID = req.body.id
        if (!taskID) return res.status(402).json(utils.JParser('provide the tasks id', false, []));

        const body = { _id: taskID, salesAgentID: salesAgentID, createBy: 1 }
        const check = await ModelTask.findOne(body)
        if (check) {
            const tasks = await ModelTask.deleteOne(body)
            return res.json(utils.JParser('Tasks deleted successfully', !!tasks, []));
        } else {
            return res.json(utils.JParser("Tasks not found or you are not authorized", !!tasks, []));
        }

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});

exports.getAgentTaskByStatus = useAsync(async (req, res) => {

    try {

        const status = req.params.status
        const salesAgentID = req.salesAgentID

        if (status) {
            const tasks = await ModelTask.find({ status: status, salesAgentID: salesAgentID });

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