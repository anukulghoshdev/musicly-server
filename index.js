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







function verifyJWT(req, res, next) {
    // console.log('token for my orders data',req.headers.authorization); // mybookingorders

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        // console.log('from jwtverify', decoded ); // { email: 'henilin695@jernang.com', iat: 1669009438, exp: 1669013038 }
        req.decoded = decoded;
        next();
    })

}





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

        app.get('/users/buyer', async(req,res)=>{
            const role=req.query.role
            const query={role:role}
            const buyers=await usersCollection.find(query).toArray();
            res.send(buyers);
        })
        app.get('/users/seller', async(req,res)=>{
            const role=req.query.role
            const query={role:role}
            const sellers=await usersCollection.find(query).toArray();
            res.send(sellers);
        })


        app.put('/googleusers', async(req, res)=>{ // by my logic
            const email = req.query.email;
            // console.log(email);
            const user = req.body;
            // console.log(user);

            const filter = {email:user.email};
            const options = { upsert:true };
            const updateDoc={
                $set:{
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options)
            // console.log(result);
            res.send(result)            
        })


        app.post("/bookingProducts", async(req,res)=>{
            const bookingProduct = req.body
            // console.log(bookingProduct);
            const query = {
                email:bookingProduct.email,
                product_name:bookingProduct.product_name
            }
            const booked = await bookingProductCollection.find(query).toArray();
            // console.log(booked);
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

        app.get('/mybookingorders',verifyJWT, async(req, res)=>{ // token dibo orders gula dekhanor jonno
            const email = req.query.email;

            const decodedEmail = req.decoded.email;
            if(email !== decodedEmail){
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            
            const query = {email: email}
            const bookingOrders = await bookingProductCollection.find(query).toArray();
            res.send(bookingOrders);
        })

        // check user as admin
        app.get('/users/admin/:email', async(req, res)=>{
            const email = req.params.email;
            const query = {email: email};
            const user = await usersCollection.findOne(query);
            res.send({adminIs: user?.role === 'Admin'});
        })
    }
    finally {

    }

}
run().catch(e => console.log(e.message))

















app.listen(port, () => {
    console.log('musicly server running on port', port)
})