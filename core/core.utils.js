

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