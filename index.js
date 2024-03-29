const express = require('express')
const app = express();

const cors = require('cors')
app.use(cors());

const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
require('dotenv').config();
const jwt = require('jsonwebtoken');


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express');


const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


app.get('/', async (req, res) => {
    res.send('musicly server is running')
})







const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tr6mdf5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });







function verifyJWT(req, res, next) {
    // console.log('token for my orders data',req.headers.authorization); // mybookingorders

    const authHeader = req.headers.authorization;
    // console.log('inside verifyJWT function', authHeader);
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
        const bookingProductCollection = client.db("musicly").collection("bookingProduct"); // orders
        const paymentsCollection = client.db("musicly").collection("payments");

        const verifySeller = async (req, res, next) => {
            console.log("Inside verifyAdmin function ", req.decoded.email);
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'Seller') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }


        // get all categories
        app.get('/categories', async (req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
        })

        // // get products category id wise
        // app.get('/category/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { category_id: id }
        //     const products = await productCollection.find(query).toArray();
        //     res.send(products);
        // })



        // // get products by category name wise
        app.get('/category/:name', async (req, res) => { // 
            const name = req.params.name;
            const query = { Category_name: name }
            const products = await productCollection.find(query).toArray();
            res.send(products);
        })

        // get all products
        app.get('/products', async (req, res) => {
            const query = {}
            const products = await productCollection.find(query).toArray();
            res.send(products)
        })

        // make advertise
        app.put('/product/advertise/:id', async (req, res) => {
            const id = req.params.id;

            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    advertise: true
                }
            }
            const result = await productCollection.updateOne(filter, updatedDoc, options)
            res.send(result);
        })

        app.get('/products/advertise', async (req, res) => {
            // const advertise = req.query.advertise
            // console.log(advertise)
            const query = {
                advertise: true,
            }

            const products = await productCollection.find(query).toArray();
            console.log(products);
            res.send(products)
        })



        app.put('/user/seller/verify/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    verified: true
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options)
            res.send(result);
        })

        // // get all verify seller --------------------------
        // app.get('/users/seller', async(req,res)=>{
        //     const isVerified = req.query.verified
        //     const query = {verified:isVerified}
        //     const verifiedUser = await usersCollection.findOne(query)
        //     console.log(verifiedUser);
        //     res.send(verifiedUser);
        // })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })

        app.get('/users/buyer', async (req, res) => {
            const role = req.query.role
            console.log(role);
            const query = { role: role }
            const buyers = await usersCollection.find(query).toArray();
            res.send(buyers);
        })

        app.get('/users/seller', async (req, res) => {
            const role = req.query.role
            const query = { role: role }
            const sellers = await usersCollection.find(query).toArray();
            res.send(sellers);
        })

        // delete a single user
        app.delete('/user/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })


        app.put('/googleusers', async (req, res) => { // by my logic
            const email = req.query.email;
            // console.log(email);
            const user = req.body;
            // console.log(user);

            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options)
            // console.log(result);
            res.send(result)
        })


        app.post("/bookingProducts", async (req, res) => {
            const bookingProduct = req.body
            // console.log(bookingProduct);
            const query = {
                email: bookingProduct.email,
                product_name: bookingProduct.product_name
            }
            const booked = await bookingProductCollection.find(query).toArray();
            // console.log(booked);
            if (booked.length) {
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
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '20d' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' });
        })


        // get all my order for buyers
        app.get('/mybookingorders', verifyJWT, async (req, res) => { // token dibo orders gula dekhanor jonno
            const email = req.query.email;
            console.log(email)
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            const query = { email: email }
            const bookingOrders = await bookingProductCollection.find(query).toArray();
            res.send(bookingOrders);

        })

        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await bookingProductCollection.findOne(query)
            res.send(order);
        })

        // seller
        app.post('/addproducts', verifyJWT, verifySeller, async (req, res) => { // get authorization verifyjwt, verify seller
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result)
        })

        app.get('/myproducts', verifyJWT, verifySeller, async (req, res) => {  // get authorization verifyjwt, verify seller 
            const email = req.query.email;


            const seller_name = req.query.seller_name;
            const query = { seller_name: seller_name }
            const myproducts = await productCollection.find(query).toArray();
            res.send(myproducts)

        })

        // delete a single product
        app.delete('/product/:id',verifyJWT, verifySeller, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query)
            res.send(result);
        })



        // check user as admin
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'Admin' });
        })

        // check user as seller
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'Seller' });
        })

        // // check user as normal user/buyer
        // app.get('/users/buyer/:email', async (req, res) => {
        //     const email = req.params.email;
        //     const query = { email }
        //     const user = await usersCollection.findOne(query);
        //     res.send({ isSeller: user?.role === 'Buyer' });
        // })


        app.get('/productCategories', async (req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).project({ Category_name: 1 }).toArray();
            // console.log(categories);
            res.send(categories)
        })

        // payments in stripe
        app.post('/create-payment-intent', async (req, res) => {
            const order = req.body;
            const price = order.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        // after payments insert payment info & update product & productBooking(order) collection
        app.post('/payments', async (req, res) => {

            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);

            const id = payment.bookingId
            const productName = payment.product_name

            const filter = { _id: ObjectId(id) }
            const query = { product_name: productName }

            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updateBookingCollection = await bookingProductCollection.updateOne(filter, updatedDoc)
            const updateProductCollection = await productCollection.updateOne(query, updatedDoc)
            res.send(result);
        })
    }

    finally {

    }

}
run().catch(e => console.log(e.message))

















app.listen(port, () => {
    console.log('musicly server running on port', port)
})