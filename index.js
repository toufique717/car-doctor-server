const express = require('express');
const cors = require('cors');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config();
const app =  express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());




 
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD} @cluster0.mamyvkv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mamyvkv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();


    const servicecollection = client.db('car-doctor').collection('services');
     const  bookingcollection = client.db('car-doctor').collection('bookings');

      app.get('/services', async (req, res) => {

        const cursor = servicecollection.find();
        const result = await cursor.toArray();

     // const result = await collection.find({}).toArray();
      res.send(result);
    });


    app.patch('/bookings/:id',async(req,res)=>
    {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id)}
      const updatebooking = req.body;
      console.log(updatebooking);

      const updateDoc =
      {
        $set:
        {
          status:updatebooking.status
        }
      };

      const result = await bookingcollection.updateOne (filter,updateDoc);
      res.send(result);
    })




   app.delete('/bookings/:id', async(req,res) =>
  {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await bookingcollection.deleteOne(query);
    res.send(result);
  })


      app.get('/services/:id', async (req, res) => {

        const id =req.params.id;
        const query = {_id:new ObjectId(id)}

        const options =
        {
          // projection:{title,price:1,service_id:1},
           projection: { title: 1, price: 1, service_id: 1 ,img: 1},
        };
        const result = await servicecollection.findOne(query,options);

        // const cursor = servicecollection.find();
        // const result = await cursor.toArray();


 
         res.send(result);
    });



    app.post('/bookings', async(req,res) =>
    {
      const booking =req.body;
      console.log(booking);
      const result = await bookingcollection.insertOne(booking);
      res.send(result);

    })

    app.get('/bookings', async (req, res) => {

      console.log(req.query.email);
      let query = {};
      if(req.query?.email)
      {
        query = {email:req.query.email}
      }
      
      const result = await bookingcollection.find(query).toArray();
      res.send(result);
    });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   //await client.close();
  }
}
run().catch(console.dir);






 app.get('/', async (req, res) => {
      
      res.send( 'Car Doctor is Running');
    });


app.listen(port, () => {
console.log(` Car Doctor Server is Running on ${port}`);
});

 