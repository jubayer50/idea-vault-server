const express = require("express");
const app = express();
var cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
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

//  get the jwks
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.FRONT_END_URL}/api/auth/jwks`),
);

// token verify
const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  if (!authHeader) {
    res.status(401).send({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).send({ message: "Unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    next();
  } catch (error) {
    return res.status(403).send({ message: "Forbidden" });
  }
};

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
    app.get("/ideas/:IdeaId", verifyToken, async (req, res) => {
      const { IdeaId } = req.params;

      const query = {
        _id: new ObjectId(IdeaId),
      };

      const result = await ideaCollections.findOne(query);

      res.send(result);
    });

    // for meta data
    app.get("/idea/:IdeaId", async (req, res) => {
      const { IdeaId } = req.params;

      const query = {
        _id: new ObjectId(IdeaId),
      };

      const result = await ideaCollections.findOne(query, {
        projection: {
          name: 1,
          _id: 0,
        },
      });

      // const result = await ideaCollections.findOne(query);

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

    // ides patch method
    app.patch("/ideas/:id", async (req, res) => {
      const { id } = req.params;

      const filter = { _id: new ObjectId(id) };

      const updateData = req.body;

      const result = await ideaCollections.updateOne(filter, {
        $set: updateData,
      });

      res.send(result);
    });

    // idea delete method
    app.delete("/ideas/:id", async (req, res) => {
      const { id } = req.params;

      const result = await ideaCollections.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    // ------------------------------------------------------------------------

    // get comments method
    app.get("/comments", verifyToken, async (req, res) => {
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

    // update / patch comments method
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

    // delete comment method
    app.delete("/comments/:id", async (req, res) => {
      const { id } = req.params;

      const result = await commentsCollection.deleteOne({
        _id: new ObjectId(id),
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
