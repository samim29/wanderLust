const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reservationSchema = new Schema({
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    checkin: Date,
    checkout: Date,
    guests: Number,
    nights: Number,
    totalPrice: Number
});

const Reservation = mongoose.model("Reservation", reservationSchema);
module.exports = Reservation;
