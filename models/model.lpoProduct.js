const mongoose = require('mongoose')

const lpoSchema = new mongoose.Schema({
    lpo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-lpo',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-product',
        required: true
    },
    quantity: {
        type: Number,
        default: 1
    },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})


const ModelLpoProduct = mongoose.model("model-lpo-product", lpoSchema)

module.exports = ModelLpoProduct