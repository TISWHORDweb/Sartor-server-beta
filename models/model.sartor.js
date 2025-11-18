const mongoose = require('mongoose')

const sartorSchema = new mongoose.Schema({
    fullName: {
        type: String,
    },
    address: {
        type: String,
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
    },
    image: {
        type: String,
    },
    password: {
        type: String,
    },
    token: {
        type: String,
    },
    lastLogin: {
        type: String,
    },
    online: {
        type: String,
    },
    userId: {
        type: String,
    },
    userRole: {
        type: String,
        default: "sartor"
    },
    blocked: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    passwordChanged: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        default: "sartor"
    },
    type: { type: Number, default: 0 },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})

sartorSchema.pre(/^find/, function (next) {
    if (this.getFilter().includeDeleted !== true) {
        this.where({ isDeleted: false });
    }
    next();
});

const ModelSartor = mongoose.model("model-sartor", sartorSchema)

module.exports = ModelSartor