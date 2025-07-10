const express = require("express");
const { randomBytes } = require("crypto");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

app.use(cors());

// In-memory store for posts
const posts = {};
app.get("/posts", (req, res) => {
  res.send(posts);
});

app.post("/posts", async (req, res) => {
  const id = randomBytes(4).toString("hex");
  const { title } = req.body;

  posts[id] = {
    id,
    title,
  };

  // Notify the event bus about the new post
  await axios
    .post("http://localhost:4005/events", {
      type: "PostCreated",
      data: { id: posts[id] },
    })
    .catch((err) => {
      console.error("Error notifying event bus:", err.message);
      // Handle the error (e.g., retry, log, etc.)
    });

  res.status(201).send(posts[id]);
});

app.listen(4000, () => {
  console.log("Posts API is running on port 4000");
});
