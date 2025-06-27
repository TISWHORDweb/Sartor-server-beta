const ModelBatch = require("../models/model.batch");
const ModelCustomer = require("../models/model.customer");
const ModelInvoice = require("../models/model.invoice");
const ModelProduct = require("../models/model.LabelGenerator");
const ModelLead = require("../models/model.lead");
const ModelUser = require("../models/model.user");


class CoreError extends Error {
    constructor(msg, code) {
        super(msg);
        this.statusCode = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

exports.CoreError = CoreError;

//json parser function
exports.JParser = (m, s, d) => ({ message: m, status: s, data: d });

exports.isJson = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

exports.generatePassword = (length) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }

    return password;
}

exports.generatePercent = (x, y) => {
    return (x / y) * 100;
}

exports.genID = async (id) => {
    // 1. Find the last assigned SMO ID
    let lastData

    if (id === 1) {
        lastData = await ModelUser.findOne().sort({ userId: -1 }).limit(1);
    } else if (id === 2) {
        lastData = await ModelProduct.findOne().sort({ batchId: -1 }).limit(1);
    } else if (id === 3) {
        lastData = await ModelCustomer.findOne().sort({ customerId: -1 }).limit(1);
    } else if (id === 4) {
        lastData = await ModelLead.findOne().sort({ userId: -1 }).limit(1);
    } else if (id === 5) {
        lastData = await ModelInvoice.findOne().sort({ invoiceId: -1 }).limit(1);
    } else if (id === 6) {
        lastData = await ModelBatch.findOne().sort({ batchNumber: -1 }).limit(1);
    }

    let lastNumber = 0;
    if (id === 1) {
        if (lastData && lastData.userId) {
            const parts = lastData.userId.split('-');
            lastNumber = parseInt(parts[1]) || 0;
        }
    } else if (id === 2) {
        if (lastData && lastData.batchId) {
            const parts = lastData.batchId.split('-');
            lastNumber = parseInt(parts[1]) || 0;
        }
    } else if (id === 3) {
        if (lastData && lastData.customerId) {
            const parts = lastData.customerId.split('-');
            lastNumber = parseInt(parts[1]) || 0;
        }
    } else if (id === 4) {
        if (lastData && lastData.userId) {
            const parts = lastData.userId.split('-');
            lastNumber = parseInt(parts[1]) || 0;
        }
    } else if (id === 5) {
        if (lastData && lastData.invoiceId) {
            const parts = lastData.invoiceId.split('-');
            lastNumber = parseInt(parts[1]) || 0;
        }
    } else if (id === 6) {
        if (lastData && lastData.batchNumber) {
            const parts = lastData.batchNumber.split('-');
            lastNumber = parseInt(parts[1]) || 0;
        }
    }

    // 3. Generate the next ID
    const prefix = id === 1 || id === 4 ? "SMO" : id === 2 || id === 6 ? "BCH" : id === 3 ? "CUS" : "INV"
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const dateCode = `${year}${month}`;
    const nextNumber = (lastNumber + 1).toString().padStart(2, '0');

    return `${prefix}${dateCode}-${nextNumber}`;
}