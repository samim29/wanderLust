require("dotenv").config();
const mongoose = require("mongoose");
const Listing = require("./models/listing"); // or your path
// other models
const Reservation = require("./models/reservation"); // or your path
const User = require("./models/user"); // or your path
const initdata = require("./init/data.js");
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Connected to Atlas!");
    // seed logic here
  })
  .catch(console.log);

  const initDB = async () => {
    await Listing.deleteMany({});
    await Listing.insertMany(initdata.data);
    console.log("data was initialized");
}

initDB();

