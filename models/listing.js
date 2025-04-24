const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    title: {
        type: String,
        require: true,
    },
    description: String,
    image: {
        type: String,
        default:"https://www.istockphoto.com/photo/aerial-view-of-canareef-resort-maldives-herathera-island-addu-atoll-gm961525630-262573447?utm_campaign=srp_photos_top&utm_content=https%3A%2F%2Funsplash.com%2Fs%2Fphotos%2Fisland&utm_medium=affiliate&utm_source=unsplash&utm_term=island%3A%3A%3A",
        set: (v) => v===""? "https://www.istockphoto.com/photo/aerial-view-of-canareef-resort-maldives-herathera-island-addu-atoll-gm961525630-262573447?utm_campaign=srp_photos_top&utm_content=https%3A%2F%2Funsplash.com%2Fs%2Fphotos%2Fisland&utm_medium=affiliate&utm_source=unsplash&utm_term=island%3A%3A%3A" : v,
    },
    price: Number,
    location: String,
    country: String,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
});

const Listing = mongoose.model("Listing",listingSchema);
module.exports = Listing;