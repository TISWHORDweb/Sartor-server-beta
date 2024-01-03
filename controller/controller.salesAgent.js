const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const ModelSalesAgent = require("../models/model.salesAgent");



exports.editSalesAgent = useAsync(async (req, res) => {

    try {

        const salesAgentID = req.salesAgentID 
        const body = req.body

        if (!salesAgentID)   return res.status(402).json(utils.JParser('provide the salesAgent id', false, []));

        await ModelSalesAgent.updateOne({ _id: salesAgentID }, body).then(async () => {
            const salesAgent = await ModelSalesAgent.find({ _id: salesAgentID });
            return res.json(utils.JParser('Sales Agent Update Successfully', !!salesAgent, salesAgent));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.getSalesAgent = useAsync(async (req, res) => {

    try {

        const salesAgentID = req.salesAgentID

        const salesAgent = await ModelSalesAgent.findOne({ _id: salesAgentID });
        return res.json(utils.JParser('Sales Agent fetch successfully', !!salesAgent, salesAgent));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.singleSalesAgent = useAsync(async (req, res) => {

    try {

        const salesAgentID = req.params.id
        const salesAgent = await ModelSalesAgent.findOne({ _id: salesAgentID });
        return res.json(utils.JParser('Sales Agent fetch successfully', !!salesAgent, salesAgent));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})


exports.allSalesAgent = useAsync(async (req, res) => {

    try {
        const salesAgent = await ModelSalesAgent.find();
        return res.json(utils.JParser('All Sales Agent fetch successfully', !!salesAgent, salesAgent));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteSalesAgent = useAsync(async (req, res) => {
    try {
        const salesAgentID = req.body.id
        if (!salesAgentID)   return res.status(402).json(utils.JParser('provide the salesAgent id', false, []));

        const salesAgent = await ModelSalesAgent.deleteOne({ _id: salesAgentID })
        return res.json(utils.JParser('Sales Agent deleted successfully', !!salesAgent, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});