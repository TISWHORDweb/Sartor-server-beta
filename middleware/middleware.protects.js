/**
 * Slantapp code and properties {www.slantapp.io}
 */

const { errorHandle, useAsync, utils } = require('../core');
const CryptoJS = require("crypto-js");
const ModelAdmin = require('../models/model.admin');
const ModelEmployee = require('../models/model.employee');
const ModelUser = require('../models/model.user');

//body safe state
exports.bodyParser = (req, res, next) => {
    if (!Object.keys(req.body).length > 0) throw new errorHandle("the document body is empty", 202);
    else next();
}

const PRIVILEGED_ROLES = ['admin'];

//universal
exports.authMiddleware = useAsync(async (req, res, next) => {
    const sToken = req.headers['s-token'];

    if (sToken === 'undefined') { res.status(401).json(utils.JParser("Unauthorized Access, Use a valid token and try again", false, [])); }

    //check and decode confirm code validity
    const isValid = await ModelUser.findOne({ token: sToken });

    if (isValid) {
        //****** Decrypt Last Login Date and Time *******//
        const bytes = CryptoJS.AES.decrypt(isValid.lastLogin, process.env.SECRET_KEY);
        let lastLogin = bytes.toString(CryptoJS.enc.Utf8);

        //****** Convert to date from string *******//
        lastLogin = JSON.parse(lastLogin)
        lastLogin = new Date(lastLogin)

        //****** Calculate an hour ago in milliseconds *******//
        const oneHour = 60 * 60 * 1000; /* ms */

        //********** Throw error if token has expired (1hr) **************//
        if (((new Date) - lastLogin) > oneHour) { res.status(401).json(utils.JParser("Invalid or expired token, Use a valid token and try again", false, [])); }

        req.userId = isValid._id
        req.user = isValid
        if (!isValid.blocked) next();
        else return res.status(400).json(utils.JParser("token is valid but is not authorized for this route, Use a valid token and try again", false, []));
    } else res.status(400).json(utils.JParser("Invalid token code or token, Use a valid token and try again", false, []));
})

exports.roleMiddleware = (roles) => {
  return (req, res, next) => {
    const userRole = req.user.userRole;
    
    // Automatically allow privileged roles
    if (PRIVILEGED_ROLES.includes(userRole)) {
      return next();
    }
    
    // Check if user's role is included in the allowed roles
    if (!roles.includes(userRole)) {
      return res.status(403).send({ error: 'Access denied' });
    }
    
    next();
  };
};