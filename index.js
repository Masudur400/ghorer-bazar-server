const express = require('express');
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
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
        const ordersCollection = client.db('ghorer-bazar').collection('orders')



        // jwt api 
        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.AccessToken, { expiresIn: '3h' })
            res.send({ token })
        })

        // verify token 
        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access !' })
            }
            const token = req.headers.authorization.split(' ')[1]
            jwt.verify(token, process.env.AccessToken, (error, decoded) => {
                if (error) {
                    return res.status(401).send({ message: 'unauthorized access !' })
                }
                req.decoded = decoded
                next()
            })
        }

        // verify Admin and Moderator 
        const verifyAdminAndModerator = async (req, res, next) => {
            const email = req.decoded.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            const isAdminAndModerator = user?.role === 'Moderator' || user?.role === "Admin"
            if (!isAdminAndModerator) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next()
        }

        //verify Admin 
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            const isAdmin = user?.role === 'Admin'
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next()
        }

        // users post 
        app.post('/users', async (req, res) => {
            const userInfo = req.body
            const query = { email: userInfo.email }
            const existingUser = await usersCollection.findOne(query)
            if (existingUser) {
                return
            }
            const result = await usersCollection.insertOne(userInfo)
            res.send(result)
        })

        // users get 
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })

        // get admin user  
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === "Admin";
            }
            res.send({ admin })
        })

        // get moderator user 
        app.get('/users/moderator/:email',  async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let moderator = false;
            if (user) {
                moderator = user?.role === "Moderator";
            }
            res.send({ moderator })
        })

        // user get by email 
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await usersCollection.findOne(query)
            res.send(result)
        })

        // user get by id 
        app.get('/users/user/:id', verifyAdmin, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await usersCollection.findOne(query)
            res.send(result)
        })

        // update user data by id 
        app.patch('/users/user/:id', verifyAdmin, async (req, res) => {
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
        app.post('/products',verifyAdmin,verifyAdminAndModerator, async (req, res) => {
            const data = req.body
            const result = await productsCollection.insertOne(data)
            res.send(result)
        })

        // all product get 
        app.get('/products', async (req, res) => {
            const result = await productsCollection.find().toArray()
            res.send(result)
        })

        // all product get by search
        app.get('/products/pp', async (req, res) => {
            const filter = req.query
            const query = {
                productName: {
                    $regex: filter.search,
                    $options: 'i'
                }
            }
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })

        //product get by id
        app.get('/products/:id',verifyToken, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await productsCollection.findOne(query)
            res.send(result)
        })

        //product delete by id
        app.delete('/products/:id',verifyToken,verifyAdminAndModerator, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await productsCollection.deleteOne(query)
            res.send(result)
        })

        // product update by id 
        app.patch('/products/:id',verifyToken , verifyAdminAndModerator, async (req, res) => {
            const id = req.params.id
            const data = req.body
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    productName: data.productName,
                    Price: data.Price,
                    productImage: data.productImage,
                    productDetails: data.productDetails,
                    productCategory: data.productCategory,
                    productAddDate: data.productAddDate
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc)
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
        app.get('/carts/id/:id',verifyToken, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await cartsCollection.findOne(query)
            res.send(result)
        })

        // delete cart by id 
        app.delete('/carts/:id',verifyToken, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await cartsCollection.deleteOne(query)
            res.send(result)
        })

        // post order 
        app.post('/orders',verifyToken, async (req, res) => {
            const order = req.body
            const orderResult = await ordersCollection.insertOne(order)
            // delete cart items 
            const query = {
                _id: {
                    $in: order.productsIds.map(id => new ObjectId(id))
                }
            }
            const deleteResult = await cartsCollection.deleteMany(query)
            res.send({ orderResult, deleteResult })
        })

        // get orders 
        app.get('/orders', async (req, res) => {
            const result = await ordersCollection.find().toArray()
            res.send(result)
        })

        // get order by email 
        app.get('/orders/:email',verifyToken, async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await ordersCollection.find(query).toArray()
            res.send(result)
        })

        // get order by id 
        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await ordersCollection.find(query).toArray()
            res.send(result)
        })  

        // order update by id 
        app.patch('/orders/patch/:id',verifyToken, verifyAdminAndModerator, async (req, res) => {
            const id = req.params.id
            const data = req.body
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    address: data.address,
                    totalPrice: data.totalPrice,
                    products: data.products,
                    // images:data.images,
                    orderDate: data.orderDate,
                    status: data.status,
                    productsIds: data.productsIds,
                    deliveryCharge: data.deliveryCharge,
                }
            }
            const result = await ordersCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })

        // delete order by id 
        app.delete('/orders/:id',verifyToken,  async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await ordersCollection.deleteOne(query)
            res.send(result)
        })

          









        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);







app.get('/', (req, res) => {
    res.send('ghorer bazar is running.........')
})

app.listen(port, () => {
    console.log(`Ghorer bazar is running on port, ${port}`)
})