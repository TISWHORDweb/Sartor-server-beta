const mongoose = require('mongoose')

const stocksSchema = new mongoose.Schema({
    contactNumber: {
        type: String,
    },
    ID: {
        type: String,
    },
    address: {
        type: String,
    },
    notes: {
        type: String,
    },
    level: {
        type: String,
    },
    lastStock: {
        type: String,
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["Low", "Medium", "High"],
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-product',
        required: true
    },
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-lead',
        required: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-admin',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-user',
    },
    price: {
        type: Number,
        min: 0
    },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})


// Auto-exclude deleted documents from queries
stocksSchema.pre(/^find/, function (next) {
    if (this.getFilter().includeDeleted !== true) {
        this.where({ isDeleted: false });
    }
    next();
});


const ModelStocks = mongoose.model("model-stocks", stocksSchema)

module.exports = ModelStocks