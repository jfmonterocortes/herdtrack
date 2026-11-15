require("dotenv").config();

const authRoutes = require("./routes/authRoutes")
const express = require("express");

const app = express();
const PORT = 3000;

//allows express to read json from incoming requests
app.use(express.json());

app.use("/api/auth", authRoutes);

//simple route to test that the server works
app.get("/", (req, res) => {
    res.json({message: "HerdTrack API is running"});
});


//start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})