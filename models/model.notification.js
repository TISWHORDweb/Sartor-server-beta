const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
    notification: {
        type: String,
    },
    user: {
        type: String,
    },
    status: {
        type: Boolean,
        default: false
    },
    type: { type: Number, default: 0 },
    creationDateTime: { type: Number, default: () => Date.now() },
    readDateTime: { type: Number},
    updated_at: { type: Number, default: () => Date.now() },
    isDeleted: { type: Boolean, default: false },
})

notificationSchema.pre(/^find/, function (next) {
    if (this.getFilter().includeDeleted !== true) {
        this.where({ isDeleted: false });
    }
    next();
});

const ModelNotification = mongoose.model("model-notification", notificationSchema)

module.exports = ModelNotification