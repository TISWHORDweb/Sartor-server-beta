const mongoose = require('mongoose')

const leadContactSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
    },
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'model-lead',
        required: true
    },
    role: {
        type: String,
        enum: ["COO  ", "CEO", "Manager"],  // specifies allowed values
    },
    creationDateTime: { type: Number, default: () => Date.now() },
    updated_at: { type: Number, default: () => Date.now() }
})


const ModelLeadContact = mongoose.model("model-lead-contact", leadContactSchema)

module.exports = ModelLeadContact