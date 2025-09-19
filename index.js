const express = require("express")
const app = express()
const expressLayouts = require('express-ejs-layouts');
const cors = require('cors')
const path = require('path');
const bodyParser = require('body-parser')
const Auth = require('./routes/route.auth')
let errorHandler = require('./middleware/middleware.error');
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

// app.use(cors());
// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header('Access-Control-Allow-Credentials', true);
//   res.header('Access-Control-Allow-Methods', 'DELETE, PUT, GET, POST, OPTIONS');
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

// My bro I commented the above code and added the below code for CORS issue your cors is customed so i changed it to standard one

app.use(cors({
    origin: ['https://crm.sartor.ng', 'https://crm.sartor.ng', 'http://localhost:5173/'], // replace with your frontend domain
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// I added preflight support too
app.options('*', cors());

app.use(expressLayouts);
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/docs', express.static(path.join(__dirname, 'docs')));


app.use(bodyParser.json())

app.use("/api/v1/auth", Auth)
app.use("/api/v1", Universal)

app.use('*', (req, res) => {
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

app.use(errorHandler);

// 68485355d0fe1e751b0bd383
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


// const express = require("express");
// const app = express();
// const cors = require('cors');
// const path = require('path');
// const bodyParser = require('body-parser');
// const mongoose = require('mongoose');
// const dotenv = require("dotenv");
// dotenv.config();

// const expressLayouts = require('express-ejs-layouts');
// const AuthRoutes = require('./routes/route.auth');
// const UniversalRoutes = require('./routes/route.universal');
// const errorHandler = require('./middleware/middleware.error');
// const { errorHandle } = require("./core");

// // Enable CORS with proper options
// app.use(cors({
//     origin: '*',
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));

// // Preflight support
// app.options('*', cors());

// // Middleware
// app.use(bodyParser.json());
// app.use(expressLayouts);
// app.set('view engine', 'ejs');
// app.use(express.static(path.join(__dirname, 'public')));
// app.use('/docs', express.static(path.join(__dirname, 'docs')));

// // Custom console log based on environment variable
// const originalConsoleLog = console.log;
// global.console.log = function (...args) {
//     if (process.env.CONSOLE_LOG === 'true') {
//         originalConsoleLog(...args);
//     }
// };

// // Routes
// app.use("/api/v1/auth", AuthRoutes);
// app.use("/api/v1", UniversalRoutes);

// // 404 handler
// app.use('*', (req, res) => {
//     throw new errorHandle("Resource not found", 404);
// });

// // Global error handler
// app.use((err, req, res, next) => {
//     res.status(err.status || 500).json({
//         success: false,
//         message: err.message || "Internal Server Error",
//         data: []
//     });
// });

// // Uncaught exception handler
// process.on('uncaughtException', function (err) {
//     console.error(err);
//     console.log("Node NOT exiting...");
// });

// // MongoDB Connection
// mongoose.set("strictQuery", true);
// mongoose.connect(process.env.MONGO_URL)
//     .then(() => console.log("Database Connected"))
//     .catch(err => console.log("MongoDB connection error:", err));

// // Start Server
// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => {
//     console.log('Server is running on port ' + PORT);
// });
