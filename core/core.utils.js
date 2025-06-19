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

exports.getNextSMOId = async (id) => {
    // 1. Find the last assigned SMO ID
    let lastData

    if (id === 1) {
        lastData = await ModelUser.findOne().sort({ userId: -1 }).limit(1);
    } else {
        lastData = await ModelLead.findOne().sort({ userId: -1 }).limit(1);
    }

    // 2. Extract the last number (default to 0 if no records)
    let lastNumber = 0;
    if (lastData && lastData.userId) {
        const parts = lastData.userId.split('-');
        lastNumber = parseInt(parts[1]) || 0;
    }

    // 3. Generate the next ID
    const prefix = "SMO";
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const dateCode = `${year}${month}`;
    const nextNumber = (lastNumber + 1).toString().padStart(2, '0');

    return `${prefix}${dateCode}-${nextNumber}`; // e.g., "SMO221-11"
}