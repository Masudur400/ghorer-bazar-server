const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000
app.use(cors())
app.use(express.json())





const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.nhw8ipw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const usersCollection = client.db('ghorer-bazar').collection('users')
    const productsCollection = client.db('ghorer-bazar').collection('products')
    const cartsCollection = client.db('ghorer-bazar').collection('carts')



    // users post 
    app.post ('/users', async(req, res) =>{
        const userInfo = req.body 
        const query = {email : userInfo.email}
        const existingUser = await usersCollection.findOne(query)
        if(existingUser){
            return
        }
        const result = await usersCollection.insertOne(userInfo)
        res.send(result)
    })

    // users get 
    app.get('/users', async(req, res)=>{
        const result = await usersCollection.find().toArray()
        res.send(result)
    })

    // user get by email 
    app.get('/users/:email', async (req, res) => {
        const email = req.params.email 
        const query = { email: email }
        const result = await usersCollection.findOne(query)
        res.send(result)
    })

     // user get by id 
     app.get('/users/user/:id', async (req, res) => {
        const id = req.params.id
        const query = { _id: new ObjectId(id) }
        const result = await usersCollection.findOne(query)
        res.send(result)
    })

    // update user data by id 
    app.patch('/users/user/:id', async (req, res) => {
        const id = req.params.id
        const currentUser = req.body
        const filter = { _id: new ObjectId(id) }
        const updateDoc = {
            $set: {
                name: currentUser.name,
                photo: currentUser.photo,
                email: currentUser.email,
                role: currentUser.role,
                userCreateTime: currentUser.userCreateTime
            }
        }
        const result = await usersCollection.updateOne(filter, updateDoc)
        res.send(result)
    })

    // product post 
    app.post('/products', async (req, res) => {
        const data = req.body
        const result = await productsCollection.insertOne(data)
        res.send(result)
    })

    // all product get 
    app.get('/products', async (req, res)=>{
        const result = await productsCollection.find().toArray()
        res.send(result)
    })

    //product get by id
    app.get('/products/:id', async (req, res) => {
        const id = req.params.id
        const query = { _id: new ObjectId(id) }
        const result = await productsCollection.findOne(query)
        res.send(result)
    })

    //  post cart 
    app.post('/carts', async (req, res) => {
        const data = req.body
        const result = await cartsCollection.insertOne(data)
        res.send(result)
    })

    // get carts 
    app.get('/carts', async (req, res) => {
        const result = await cartsCollection.find().toArray()
        res.send(result)
    })

    // get carts items by email 
    app.get('/carts/:email', async (req, res) => {
        const email = req.params.email
        const query = { email: email }
        const result = await cartsCollection.find(query).toArray()
        res.send(result)
    })

    // get carts items by id 
    app.get('/carts/id/:id', async (req, res) => {
        const id = req.params.id
        const query = { _id: new ObjectId(id) }
        const result = await cartsCollection.findOne(query)
        res.send(result)
    })

    // delete cart by id 
    // app.delete('/carts/:id', async (req, res) => {
    //     const id = req.params.id
    //     const query = { _id: new ObjectId(id) }
    //     const result = await cartsCollection.deleteOne(query)
    //     res.send(result)
    // })










    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);







app.get('/', (req, res)=>{
    res.send('ghorer bazar is running.........')
})

app.listen(port, ()=>{
    console.log(`Ghorer bazar is running on port, ${port}`)
})