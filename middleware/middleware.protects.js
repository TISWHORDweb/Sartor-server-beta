/**
 * Slantapp code and properties {www.slantapp.io}
 */

const {errorHandle, useAsync, utils} = require('../core');
const CryptoJS = require("crypto-js");
const ModelAdmin = require('../models/model.admin');
const ModelSalesAgent = require('../models/model.salesAgent');

//body safe state
exports.bodyParser = (req, res, next) => {
    if (!Object.keys(req.body).length > 0) throw new errorHandle("the document body is empty", 202);
    else next();
}

//adminbodyguard
exports.adminBodyGuard = useAsync(async (req, res, next) => {
    const sToken =  req.headers['s-token'];
   
    if ( sToken === 'undefined') { res.status(401).json(utils.JParser("Unauthorized Access, Use a valid token and try again", false, [])); }

    //check and decode confirm code validity
    const isValid = await ModelAdmin.findOne({token: sToken});

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
        if (((new Date) - lastLogin) > oneHour){ res.status(401).json(utils.JParser("Invalid or expired token, Use a valid token and try again", false, []));} 
   
        req.adminID = isValid._id
        if (isValid.adminType === 1) next();
        else return res.status(400).json(utils.JParser("token is valid but is not authorized for this route, Use a valid token and try again", false, []));
    } else res.status(400).json(utils.JParser("Invalid token code or token, Use a valid token and try again", false, []));
})

//salesAgentbodyguard
exports.salesAgentBodyGuard = useAsync(async (req, res, next) => {
    const sToken =  req.headers['s-token'];
   
    if ( sToken === 'undefined') { res.status(401).json(utils.JParser("Unauthorized Access, Use a valid token and try again", false, [])); }

    //check and decode confirm code validity
    const isValid = await ModelSalesAgent.findOne({token: sToken});

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
        if (((new Date) - lastLogin) > oneHour){ res.status(401).json(utils.JParser("Invalid or expired token, Use a valid token and try again", false, []));} 
        
        req.salesAgentID = isValid._id
        if (isValid.blocked === false) next();
        else return res.status(400).json(utils.JParser("token is valid but is not authorized for this route, Use a valid token and try again", false, []));
    } else res.status(400).json(utils.JParser("Invalid token code or token, Use a valid token and try again", false, []));
})