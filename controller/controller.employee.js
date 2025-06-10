const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const ModelEmployee = require("../models/model.employee");



exports.editEmployee = useAsync(async (req, res) => {

    try {

        const employeeID = req.body.id 
        const body = req.body

        if (!employeeID)   return res.status(402).json(utils.JParser('provide the employee id', false, []));

        await ModelEmployee.updateOne({ _id: employeeID }, body).then(async () => {
            const employee = await ModelEmployee.find({ _id: employeeID });
            return res.json(utils.JParser('Employee Update Successfully', !!employee, employee));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.getEmployee = useAsync(async (req, res) => {

    try {

        const employeeID = req.userId

        const employee = await ModelEmployee.findOne({ _id: employeeID });
        return res.json(utils.JParser('Employee fetch successfully', !!employee, employee));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.singleEmployee = useAsync(async (req, res) => {

    try {

        const employeeID = req.params.id
        const employee = await ModelEmployee.findOne({ _id: employeeID });
        return res.json(utils.JParser('Employee fetch successfully', !!employee, employee));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})


exports.allEmployee = useAsync(async (req, res) => {

    try {
        const employee = await ModelEmployee.find();
        return res.json(utils.JParser('All Employee fetch successfully', !!employee, employee));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteEmployee = useAsync(async (req, res) => {
    try {
        const employeeID = req.body.id
        if (!employeeID)   return res.status(402).json(utils.JParser('provide the employee id', false, []));

        const employee = await ModelEmployee.deleteOne({ _id: employeeID })
        return res.json(utils.JParser('Employee deleted successfully', !!employee, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});