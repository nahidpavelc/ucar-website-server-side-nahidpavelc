const express = require('express');
const fileUpload = require('express-fileupload');
const app = express()

const { MongoClient } = require('mongodb');
const cors = require('cors');
const admin = require("firebase-admin");
require('dotenv').config();
const objectId = require('mongodb').ObjectId;
const stripe = require('stripe')(process.env.STRIPE_SECRET);


//Find Object ID
const ObjectId = require('mongodb').ObjectId;
const port = process.env.PORT || 5050;

// sdk server
// u - car - firebase - adminsdk.json
const serviceAccount = require('./u-car-8c946-firebase-adminsdk-kdooe-bf0a12161e.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

//middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xvoog.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const idToken = req.headers.authorization.split('Bearer ')[1];
        console.log('here is token', idToken);
        // try {
        //     const decodedUser = await admin.auth().verifyIdToken(idToken);
        //     req.decodedUserEmail = decodedUser.email;
        // }
        // catch {
        // }
    }
    next();
}

async function run() {
    try {
        await client.connect();
        const database = client.db("u_cars");
        const carsCollection = database.collection("cars");
        const reviewsCollection = database.collection("reviews");
        const bookingsCollection = database.collection('bookings');
        const userCollection = database.collection('users');

        //POST API cars
        app.post('/cars', async (req, res) => {
            const name = req.body.name;
            const detail = req.body.detail;
            const price = req.body.price;
            const pic = req.files.image;
            const picData = pic.data;
            const encodePic = picData.toString('base64');
            const imageBuffer = Buffer.from(encodePic, 'base64');
            const car = {
                name,
                detail,
                price,
                img: imageBuffer
            }
            const result = await carsCollection.insertOne(car);
            res.json(result);
        })
        // GET ALL Cars 
        app.get('/cars', async (req, res) => {
            const cursor = carsCollection.find({});
            const cars = await cursor.toArray();
            res.json(cars);
        })
        //GET Single Car
        app.get('/cars/:id', async (req, res) => {
            const id = req.params.id;
            console.log('car id', id);
            const query = { _id: ObjectId(id) };
            const car = await carsCollection.findOne(query);
            res.json(car);
        })
        //DELETE API Car
        app.delete('/cars/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const car = await carsCollection.deleteOne(query);
            res.json(car);
        })

        // GET API Review
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const reviews = await cursor.toArray();
            res.json(reviews);
        })
        //Post API review
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.json(result);
        })
        //Delete API review
        app.delete('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewsCollection.deleteOne(query);
            res.json(result);
        })

        //POST Booking
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            console.log(result);
            res.json(result);
        })
        //GET ALL BOOKING
        // app.get('/bookings', async (req, res) => {
        //     const cursor = bookingsCollection.find({});
        //     const bookings = await cursor.toArray();
        //     res.json(bookings);
        // });
        app.get('/bookings', async (req, res) => {
            let query = {};
            const email = req.query.email;
            if (email) {
                query = { email: email };
            }
            const cursor = bookingsCollection.find(query);
            const bookings = await cursor.toArray();
            res.json(bookings);
        });
        //GET Booking Email
        // app.get('/bookings', verifyToken, async (req, res) => {
        //     console.log(req.headers.authorization)
        //     const email = req.query.email;
        //     if (req.decodedUserEmail === email) {
        //         const query = { email: email };
        //         const cursor = bookingsCollection.find(query);
        //         const bookings = await cursor.toArray();
        //         res.json(bookings);
        //     }
        //     else {
        //         res.status(401).json({ message: 'User not Authorized' })
        //     }
        // });
        //GET Single Booking
        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bookingsCollection.findOne(query);
            res.json(result);
        });
        //DELETE API Booking
        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bookingsCollection.deleteOne(query);
            res.json(result);
        })
        //Update API Booking
        app.put('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    payment: payment
                }
            };
            const result = await bookingsCollection.updateOne(filter, updateDoc);
            res.json(result);
        })


        //GET API users
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })
        //POST API users
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            console.log(result);
            res.json(result);
        })
        //PUT API users update data on DAtabase
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        })
        //PUT API for ADMIN
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await userCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await userCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'you do not have access to make Admin' })
            }
        })

        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                payment_method_types: ['card']
            });
            res.json({ clientSecret: paymentIntent.client_secret })
        })
    }

    finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Running CAR Server ');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})



