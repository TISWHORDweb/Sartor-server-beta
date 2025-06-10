const mongoose = require('mongoose')

const taskCommentSchema = new mongoose.Schema({
    comment: {
        type: String,
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-task'
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-admin',
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-new-employee',
    },
    createBy: { type: Number, default: 0 }, // admin = 2 | agent =  1
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})


const ModelTaskComment = mongoose.model("model-task-comment", taskCommentSchema)

module.exports = ModelTaskComment