const mongoose = require('mongoose')

const labelGeneratorSchema = new mongoose.Schema({
    manufacturer: {
        type: String,
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-supplier',
        required: true
    },
    batchID: {
        type: String,
    },
    address: {
        type: String,
    },
    quantity: {
        type: String,
    },
    unit: {
        type: String,
    },
    buyingPrice: {
        type: String,
    },
    expiryDate: {
        type: String,
    },
    image: {
        type: String,
    },
    subImage: {
        type: String,
    },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})


const ModelProduct = mongoose.model("model-label-generator", labelGeneratorSchema)

module.exports = ModelProduct