const express = require('express')
const app = express();

const cors = require('cors')
app.use(cors());

const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
require('dotenv').config();
const jwt = require('jsonwebtoken'); 


app.get('/', async(req, res)=>{
    res.send('musicly server is running')
})


app.listen(port, ()=>{
    console.log('musicly server running on port', port)
})