const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const Joi = require("joi");
const ModelTask = require("../models/model.task");
const ModelTaskAtivity = require("../models/model.tasksActivity");
const { generatePercent } = require("../core/core.utils");


exports.CreateActivityTask = useAsync(async (req, res) => {

    try {

        const salesAgentID = req.salesAgentID
        const taskID = req.body.taskID


        if (!taskID) return res.status(402).json(utils.JParser('provide the tasks id', false, []));
        const option = { salesAgentID, taskID }
        const check = await ModelTaskAtivity.findOne(option)
        const task = await ModelTask.findOne({ _id: taskID })

        if (!check && task) {
            //create data if all data available
            const schema = Joi.object({
                taskID: Joi.string().min(1).required(),
            })

            //capture data
            const { taskID } = req.body;

            //validate data
            const validator = await schema.validateAsync(req.body);

            validator.salesAgentID = salesAgentID

            const tasks = await ModelTaskAtivity.create(validator)
            return res.json(utils.JParser('Tasks Activity created successfully', !!tasks, tasks));

        } else if (check && task) {
            let status;
            const quantity = check.quantity + 1
            const body = { quantity: quantity }

            await ModelTaskAtivity.updateOne(option, body).then(async () => {
                const Activity = await ModelTaskAtivity.findOne(option);

                const percent = await generatePercent(Activity.quantity, task.quantity)

                if (percent < 100) {
                    status = 'In progress';
                } else if (percent >= 100) {
                    status = 'complete';
                }
                const bodys = {
                    percent: percent,
                    status: status,
                }

                await ModelTask.updateOne({ _id: taskID }, bodys).then(async () => {
                    const tasks = await ModelTask.find({ _id: taskID });
                    return res.json(utils.JParser('Task update Successfully', !!tasks, tasks));
                })

            })
        }

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

})

exports.singleTaskActivity = useAsync(async (req, res) => {

    try {
        const taskActivityID = req.params.id
        if (!taskActivityID) return res.status(402).json(utils.JParser('provide the tasks id', false, []));

        const tasks = await ModelTaskAtivity.findOne({ _id: taskActivityID });

        res.json(utils.JParser('Task Activity fetch successfully', !!tasks, tasks));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.allTaskActivity = useAsync(async (req, res) => {

    try {
        const tasks = await ModelTaskAtivity.find();

        res.json(utils.JParser('All Task Activity fetch successfully', !!tasks, tasks));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteTaskActivity = useAsync(async (req, res) => {
    try {
        const taskActivityID = req.body.id
        if (!taskActivityID) return res.status(402).json(utils.JParser('provide the tasks id', false, []));

        const tasks = await ModelTaskAtivity.deleteOne({ _id: taskActivityID })
        return res.json(utils.JParser('Tasks Activity deleted successfully', !!tasks, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});
