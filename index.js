const express = require('express')
const { MongoClient } = require('mongodb');

const cors = require('cors');
require('dotenv').config();

const app = express()
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xvoog.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db("u_cars");
        const carsCollection = database.collection("cars");
        const reviewsCollection = database.collection("reviews");
        const bookingsCollection = database.collection('bookings');
        const userCollection = database.collection('users');

        //POST API Booking
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            console.log(result);
            res.json(result);
        })
        //GET API Booking
        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const cursor = bookingsCollection.find(query);
            const booking = await cursor.toArray();
            res.json(booking);
        });

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
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            console.log('put', user);
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.json(result);
        })


        // GET API Review
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const reviews = await cursor.toArray();
            res.send(reviews);
        })
        //Post API review
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            console.log('hit the post api', review);
            const result = await reviewsCollection.insertOne(review);
            console.log(result);
            res.json(result);
        })

    }

    finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Running Genius Server ');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})



