const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    businessEmail: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    jobTitle: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    companyName: { type: String, trim: true },
    companySize: { type: String, trim: true },
    country: { type: String, trim: true }
}, { timestamps: true });


const ModelContact = mongoose.model('contact', contactSchema);

module.exports = ModelContact