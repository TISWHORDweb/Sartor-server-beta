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
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-user',
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-admin',
        required: true
    },
    dueDate: { type: String },
    taskFor: { type: Number, default: 0 }, // single employee = 1 | all employee =  2
    quantity: { type: Number, default: 0 },
    percent: { type: Number, default: 0 },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})

taskSchema.pre(/^find/, function (next) {
    if (this.getFilter().includeDeleted !== true) {
        this.where({ isDeleted: false });
    }
    next();
});

const ModelTask = mongoose.model("model-task", taskSchema)

module.exports = ModelTask