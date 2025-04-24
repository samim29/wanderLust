const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const User = require('./models/user'); 
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const bcrypt = require('bcryptjs');
const session = require('express-session');
const Reservation = require("./models/reservation.js");
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL;

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

app.use(session({
    secret: process.env.SESSION_SECRET || 'fallbacksecret', // Update this line
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));
// Middleware to pass user to all views
app.use(async (req, res, next) => {
    if (req.session.user_id) {
        res.locals.user = await User.findById(req.session.user_id);
    } else {
        res.locals.user = null;
    }
    next();
});

// Connect to MongoDB
main().then(() => console.log("✅ Connected to DB")).catch(console.error);

async function main() {
    await mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
}


// Middleware to protect routes
function requireLogin(req, res, next) {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    next();
}

// Home redirects to listings
app.get("/", (req, res) => {
    res.redirect("/listings");
});

// Index route
app.get("/listings", async (req, res) => {
    const allListings = await Listing.find({});
    res.render("./listings/index.ejs", { allListings });
});

// New listing form
app.get("/listings/new", requireLogin, (req, res) => {
    res.render("./listings/new.ejs");
});

// Create listing
app.post("/listings", requireLogin, async (req, res) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.session.user_id;
    await newListing.save();
    res.redirect("/listings");
});

// Show listing
app.get("/listings/:id", async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    res.render("./listings/show.ejs", { listing });
});

// Reserve listing
app.post("/reserve/:id", requireLogin, async (req, res) => {
    const { id } = req.params;
    try {
        const listing = await Listing.findById(id);
        if (!listing) {
            return res.send("Listing not found.");
        }
        // You could save reservation info in DB here
        res.send(`Reservation successful for "${listing.title}"!`);
        // Or redirect:
        // res.redirect(`/listings/${id}`);
    } catch (err) {
        console.error(err);
        res.send("Something went wrong while reserving.");
    }
});

app.get("/checkout/:id", requireLogin, async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    res.render("checkout.ejs", { listing });
});


app.post("/checkout/:id", requireLogin, async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    const { checkin, checkout, guests } = req.body;

    const checkInDate = new Date(checkin);
    const checkOutDate = new Date(checkout);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    const totalPrice = listing.price * guests * nights;

    res.render("checkout_summary.ejs", {
        listing,
        guests,
        nights,
        totalPrice,
        checkin,
        checkout
    });
});

app.post("/confirm", requireLogin, async (req, res) => {
    const { listingId, checkin, checkout, guests, nights, totalPrice } = req.body;

    const reservation = new Reservation({
        listing: listingId,
        user: req.session.user_id,
        checkin: new Date(checkin),
        checkout: new Date(checkout),
        guests: parseInt(guests),
        nights: parseInt(nights),
        totalPrice: parseFloat(totalPrice)
    });

    await reservation.save();
    res.redirect("/my-bookings");
});

app.get("/my-bookings", requireLogin, async (req, res) => {
    const reservations = await Reservation.find({ user: req.session.user_id }).populate('listing');
    res.render("my_bookings.ejs", { reservations });
});


// Edit listing form
app.get("/listings/:id/edit", requireLogin, async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing.owner.equals(req.session.user_id)) {
        return res.status(403).send("You don't have permission to edit this listing.");
    }
    res.render("./listings/edit.ejs", { listing });
});

// Update listing
app.put("/listings/:id", requireLogin, async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing.owner.equals(req.session.user_id)) {
        return res.status(403).send("You can't update someone else's listing.");
    }
    await Listing.findByIdAndUpdate(req.params.id, { ...req.body.listing });
    res.redirect(`/listings/${req.params.id}`);
});

// Delete listing
app.delete("/listings/:id", requireLogin, async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing.owner.equals(req.session.user_id)) {
        return res.status(403).send("You can't delete someone else's listing.");
    }
    await Listing.findByIdAndDelete(req.params.id);
    res.redirect("/listings");
});

// Registration form
app.get('/register', (req, res) => {
    res.render('./authentication/register.ejs');
});

// Handle registration
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        req.session.user_id = newUser._id;
        res.redirect('/listings');
    } catch (err) {
        console.log(err);
        res.send("Something went wrong. Try again.");
    }
});

// Login form
app.get('/login', (req, res) => {
    res.render('./authentication/login.ejs');
});

// Handle login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.send("Invalid username or password");
    }
    req.session.user_id = user._id;
    res.redirect('/listings');
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.send("Error logging out");
        }
        res.redirect('/listings');
    });
});

// User dashboard
app.get('/dashboard', requireLogin, async (req, res) => {
    const userListings = await Listing.find({ owner: req.session.user_id });
    res.render('./user/dashboard.ejs', { listings: userListings });
});

// Start server
app.listen(8080, () => {
    console.log("Server is listening on port 8080");
});
