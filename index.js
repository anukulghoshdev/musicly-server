const express = require('express')
const app = express();

const cors = require('cors')
app.use(cors());

const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
require('dotenv').config();
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion } = require('mongodb');
const { query } = require('express');


app.get('/', async (req, res) => {
    res.send('musicly server is running')
})







const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tr6mdf5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const categoriesCollection = client.db("musicly").collection("categories");
        const productCollection = client.db("musicly").collection("products");
        const usersCollection = client.db("musicly").collection("users");
        const bookingProductCollection = client.db("musicly").collection("bookingProduct");

        // get all categories
        app.get('/categories', async (req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
        })

        // get products categorywise
        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id }
            const products = await productCollection.find(query).toArray();
            res.send(products);
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })

        app.get('/jwt', async (req, res) => { // jwt
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
                // console.log('in /jwt',email);
                return res.send({ accessToken: token });
            }
            // console.log('in jwt 138',user);
            res.status(403).send({ accessToken: '' });
        })

        app.post("/bookingProducts", async(req,res)=>{
            const bookingProduct = req.body
            // console.log(bookingProduct);
            const query = {email:bookingProduct.email}
            const booked = await bookingProductCollection.find(query).toArray();
            if(booked.length){
                const message = `you already have booked ${bookingProduct.product_name}`
                return res.send({
                    acknowledged: false,
                    message
                })
            }
            const result = await bookingProductCollection.insertOne(bookingProduct)
            res.send(result)
        })
    }
    finally {

    }

}
run().catch(e => console.log(e.message))

















app.listen(port, () => {
    console.log('musicly server running on port', port)
})