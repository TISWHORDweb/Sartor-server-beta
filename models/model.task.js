const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    description: {
        type: String,
    },
    status: {
        type: String,
        enum: ["Pending", "Due", "Assigned", "Unconfirmed", "Completed", "Received", "Overdue", "To-Do", "Confirmed"],  // specifies allowed values
        default: "Pending"                    // default value if none provided
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-admin',
        required: true
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-new-employee',
        required: true
    },
    dueDate: { type: String },
    taskFor: { type: Number, default: 0 }, // single employee = 1 | all employee =  2
    quantity: { type: Number, default: 0 },
    percent: { type: Number, default: 0 },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})


const ModelTask = mongoose.model("model-task", taskSchema)

module.exports = ModelTask