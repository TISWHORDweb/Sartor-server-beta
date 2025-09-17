const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema({
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-lead',
        required: true
    },
    customerId: {
        type: String,
    },
    status: {
        type: String,
        enum: ["Active", "In-active"],
        default: "Active"
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
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-user'
    },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})

customerSchema.pre(/^find/, function (next) {
    if (this.getFilter().includeDeleted !== true) {
        this.where({ isDeleted: false });
    }
    next();
});

const ModelCustomer = mongoose.model("model-customer", customerSchema)

module.exports = ModelCustomer