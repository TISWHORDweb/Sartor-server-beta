const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema({
    name: {
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
    state: {
        type: String,
    },
    type: {
        type: String,
        enum: ["Pharmacy  ", "Clinic"], 
    },
    image: {
        type: String,
    },
    dealSize: {
        type: String,
    },
    note: {
        type: String,
    },
    stores: {
        type: Number,
    },
    customerId: {
        type: String,
    },
    status: {
        type: String,
        enum: ["Active", "In-active"], 
        default: "Active"
    },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})


const ModelCustomer = mongoose.model("model-customer", customerSchema)

module.exports = ModelCustomer