const mongoose = require('mongoose')

const labelSchema = new mongoose.Schema({
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-batch',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-product',
        required: true
    },
    image: {
        type: String,
    },
    subImage: {
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