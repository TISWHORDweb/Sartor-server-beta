const mongoose = require('mongoose')

const labelSchema = new mongoose.Schema({
    manufacturer: {
        type: String,
    },
    // supplier: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'model-supplier',
    //     required: true
    // },
    batchID: {
        type: String,
    },
    address: {
        type: String,
    },
    quantity: {
        type: String,
    },
    expiryDate: {
        type: String,
    },
    status: {
        type: String,
        enum: ['failed', 'completed', 'training'],
        default: 'training'
    },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})


const ModelLabel = mongoose.model("model-label", labelSchema)

module.exports = ModelLabel