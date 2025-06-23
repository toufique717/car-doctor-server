 const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: 'Not authorized: No token' });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mamyvkv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const serviceCollection = client.db('car-doctor').collection('services');
    const bookingCollection = client.db('car-doctor').collection('bookings');

    app.get('/services', async (req, res) => {
      const services = await serviceCollection.find().toArray();
      res.json(services);
    });

    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const service = await serviceCollection.findOne({ _id: new ObjectId(id) });
        if (!service) return res.status(404).json({ message: 'Service not found' });
        res.json(service);
      } catch {
        res.status(400).json({ message: 'Invalid ID format' });
      }
    });

    // JWT token generation & cookie set
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000,
      });

      res.json({ success: true });
    });

    app.get('/bookings', verifyToken, async (req, res) => {
      const email = req.query.email;

      if (!email || email !== req.user.email) {
        return res.status(403).json({ message: 'Forbidden: Email mismatch' });
      }

      const bookings = await bookingCollection.find({ email }).toArray();
      res.json(bookings);
    });

    app.post('/bookings', async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.json(result);
    });

    app.patch('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      try {
        const result = await bookingCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );
        res.json(result);
      } catch {
        res.status(400).json({ message: 'Invalid ID format' });
      }
    });

    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const result = await bookingCollection.deleteOne({ _id: new ObjectId(id) });
        res.json(result);
      } catch {
        res.status(400).json({ message: 'Invalid ID format' });
      }
    });

    app.get('/', (req, res) => {
      res.send('🚗 Car Doctor is Running');
    });

    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (err) {
    console.error(err);
  }
}

run();
