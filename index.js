const express = require("express");
const app = express();
var cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const port = process.env.PORT || 5000;

const uri = process.env.MONGO_BD_URI;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    // get the database and create collection
    const database = client.db("ideaVault");
    const ideaCollections = database.collection("ideas");
    const commentsCollection = database.collection("comments");

    // ideas get method
    app.get("/ideas", async (req, res) => {
      const cursor = ideaCollections.find();
      const result = await cursor.toArray();

      res.send(result);
    });

    // idea get single data method
    app.get("/ideas/:IdeaId", async (req, res) => {
      const { IdeaId } = req.params;

      const query = {
        _id: new ObjectId(IdeaId),
      };

      const result = await ideaCollections.findOne(query);

      res.send(result);
    });

    // get method for Trending idea
    app.get("/trending-ideas", async (req, res) => {
      const cursor = ideaCollections.find().limit(6);
      const result = await cursor.toArray();

      res.send(result);
    });

    // idea post method
    app.post("/ideas", async (req, res) => {
      const ideaData = req.body;

      const result = await ideaCollections.insertOne(ideaData);
      res.send(result);

      console.log(result, "from server post method");
    });

    // ------------------------------------------------------------------------

    // get comments method
    app.get("/comments", async (req, res) => {
      const cursor = commentsCollection.find();
      const result = await cursor.toArray();

      res.send(result);
    });

    // post comments method
    app.post("/comments", async (req, res) => {
      const commentData = req.body;

      const result = await commentsCollection.insertOne(commentData);
      res.send(result);
    });

    // update comments method
    app.patch("/comments/:id", async (req, res) => {
      const { id } = req.params;

      const filter = {
        _id: new ObjectId(id),
      };

      const updateData = req.body;

      const result = await commentsCollection.updateOne(filter, {
        $set: updateData,
      });

      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`IdeaVault server is running on port ${port}!`);
});
