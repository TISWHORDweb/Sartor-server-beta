const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const ModelAdmin = require("../models/model.admin");
const { generatePassword } = require("../core/core.utils");
const bcrypt = require('bcryptjs')
const CryptoJS = require("crypto-js")
const sha1 = require('sha1');
const ModelSalesAgent = require("../models/model.salesAgent");


exports.createSalesAgent = useAsync(async (req, res) => {

    try {

        const adminID = req.adminID

        const Password = await generatePassword(9);
        console.log(Password)

        if (Password) {
            req.body.password = await bcrypt.hash(Password, 13)
        }

        if (!req.body.email  || !req.body.password ) return res.json(utils.JParser('please check the fields', false, []));

        req.body.adminID = adminID
        req.body.token = sha1(req.body.email + new Date())
        req.body.lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()

        const validates = await ModelSalesAgent.findOne({ email: req.body.email })
        if (validates) {
            return res.json(utils.JParser('There is another Sales agent with this email', false, []));
        } else {

            let salesAgent = await new ModelSalesAgent(req.body)

            await salesAgent.save().then(data => {

                data.password = "********************************"

                return res.json(utils.JParser('Congratulation Account created successfully', !!data, data));

            })
        }
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})


exports.editAdmin = useAsync(async (req, res) => {

    try {

        const adminID = req.adminID 
        const body = req.body

        if (!adminID)   return res.status(402).json(utils.JParser('provide the admin id', false, []));

        await ModelAdmin.updateOne({ _id: adminID }, body).then(async () => {
            const admin = await ModelAdmin.find({ _id: adminID });
            return res.json(utils.JParser('Admin Update Successfully', !!admin, admin));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.getAdmin = useAsync(async (req, res) => {

    try {

        const adminID = req.adminID

        const admin = await ModelAdmin.findOne({ _id: adminID });
        return res.json(utils.JParser('Admin fetch successfully', !!admin, admin));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.singleAdmin = useAsync(async (req, res) => {

    try {

        const adminID = req.params.id
        const admin = await ModelAdmin.findOne({ _id: adminID });
        return res.json(utils.JParser('Admin fetch successfully', !!admin, admin));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})


exports.allAdmin = useAsync(async (req, res) => {

    try {
        const admin = await ModelAdmin.find();
        return res.json(utils.JParser('All Admin fetch successfully', !!admin, admin));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteAdmin = useAsync(async (req, res) => {
    try {
        const adminID = req.body.id
        if (!adminID)   return res.status(402).json(utils.JParser('provide the admin id', false, []));

        const admin = await ModelAdmin.deleteOne({ _id: adminID })
        return res.json(utils.JParser('Admin deleted successfully', !!admin, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});