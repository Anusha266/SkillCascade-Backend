const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const port = process.env.PORT || 3000;
const app = require('./app');
// echo $CONN_STR
if (!process.env.CONN_STR) {
    console.error("❌ MongoDB connection string is missing!");
    process.exit(1);
}

mongoose.connect(process.env.CONN_STR, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ MongoDB Connected Successfully!");
}).catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
});

const server = app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});

process.on('SIGINT', () => {
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});
