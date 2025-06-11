const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const ModelAdmin = require("../models/model.admin");
const { generatePassword, getNextSMOId } = require("../core/core.utils");
const bcrypt = require('bcryptjs')
const CryptoJS = require("crypto-js")
const sha1 = require('sha1');
const ModelEmployee = require("../models/model.employee");
const { EmailNote } = require("../core/core.notify");


exports.createEmployee= useAsync(async (req, res) => {

    try {

        const adminID = req.userId

        const Password = await generatePassword(9);
        const employeeId = await getNextSMOId();

        if (Password) {
            req.body.password = await bcrypt.hash(Password, 13)
        }

        if (!req.body.email  || !req.body.password ) return res.json(utils.JParser('please check the fields', false, []));

        req.body.adminID = adminID
        req.body.employeeId = employeeId
        req.body.token = sha1(req.body.email + new Date())
        req.body.lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()

        const validates = await ModelEmployee.findOne({ email: req.body.email })
        if (validates) {
            return res.json(utils.JParser('There is another Sales agent with this email', false, []));
        } else {

            let employee = await new ModelEmployee(req.body)
            const email = req.body.email
            const body = {
                email:email,
                name :'',
                body: `Congratulastion an account has been created for you as a salesa agent in sator kindly use your login with your email and the following password - ${Password}`,
                subject :"Account creation"
            }

            await employee.save().then(data => {

                data.password = "********************************"

                EmailNote(body.email,body.name,body.body,body.subject)

                return res.json(utils.JParser('Congratulation Account created successfully', !!data, data));

            })
        }
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})


exports.editAdmin = useAsync(async (req, res) => {

    try {

        const adminID = req.userId 
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

        const adminID = req.userId

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