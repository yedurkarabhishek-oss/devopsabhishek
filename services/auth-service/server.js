const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Auth Service Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
