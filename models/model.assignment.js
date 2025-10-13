const mongoose = require('mongoose')

const assignmentSchema = new mongoose.Schema({
    assignedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-user'
    },
    assignedtoUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-user'
    },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() },
    isDeleted: { type: Boolean, default: false },
})

assignmentSchema.pre(/^find/, function (next) {
    if (this.getFilter().includeDeleted !== true) {
        this.where({ isDeleted: false });
    }
    next();
});

const ModelAssignment = mongoose.model("model-assignment", assignmentSchema)

module.exports = ModelAssignment