const express = require("express")
const app = express()
const expressLayouts = require('express-ejs-layouts');
const cors = require('cors')
const path = require('path');
const bodyParser = require('body-parser')
const Auth = require('./routes/route.auth')
const Admin = require('./routes/route.admin')
const Universal = require('./routes/route.universal')

const mongoose = require('mongoose');
const { errorHandle } = require("./core");

// const dotenv = require("dotenv")
// dotenv.config()

//******* logger *********//
const originalConsoleLog = console.log; // Store the original console.log function
global.console.log = function (...args) {
    if (process.env.CONSOLE_LOG === 'true') {
        originalConsoleLog(...args); // Use the original console.log function
    }
};
//******* logger *********//

app.use(cors());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'DELETE, PUT, GET, POST, OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(expressLayouts);
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/docs', express.static(path.join(__dirname, 'docs')));


app.use(bodyParser.json())

app.use("/api/v1/auth", Auth)
app.use("/api/v1/admin", Admin)
app.use("/api/v1", Universal)
app.use('*', () => {
    throw new errorHandle("Resource not found", 404);
})

process.on('uncaughtException', function (err) {
    console.error(err);
    console.log("Node NOT Exiting...");
});
// error handler
app.use(function (err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


mongoose.set("strictQuery", true);
    mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log("Database Connected")
    })
    .catch((err) => console.log(err));

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log('Server is running on port ' + port);
})
