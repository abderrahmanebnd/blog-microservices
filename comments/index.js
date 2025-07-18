const express = require("express");
const { randomBytes } = require("crypto");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

app.use(cors());

const commentsByPostId = {};

app.get("/posts/:id/comments", (req, res) => {
  const { id } = req.params;
  res.status(200).send(commentsByPostId[id] || []);
});

app.post("/posts/:id/comments", async (req, res) => {
  const commentId = randomBytes(4).toString("hex");
  const { content } = req.body;
  const { id } = req.params;

  const comments = commentsByPostId[id] || [];

  comments.push({ id: commentId, content, status: "pending" });
  commentsByPostId[id] = comments;

  await axios
    .post("http://localhost:4005/events", {
      type: "CommentCreated",
      data: { id: commentId, content, postId: id, status: "pending" },
    })
    .catch((err) => {
      console.error("Error notifying event bus:", err.message);
      // Handle the error (e.g., retry, log, etc.)
    });

  comments.push({ id: commentId, content });
  commentsByPostId[id] = comments;
  res.status(201).send(comments);
});

app.post("/events", (req, res) => {
  const event = req.body;
  console.log("Received event:", event.type);
  // Handle any events if necessary
  if (event.type === "CommentModerated") {
    const { postId, id, status, content } = event.data;
    const comments = commentsByPostId[postId];
    if (comments) {
      const comment = comments.find((comment) => comment.id === id);
      if (comment) {
        comment.status = status;
      }
    }

    axios
      .post("http://localhost:4005/events", {
        type: "CommentUpdated",
        data: { id, postId, status, content },
      })
      .catch((err) => {
        console.error("Error notifying event bus:", err.message);
      });
  }
  res.send({ status: "OK" });
});

app.listen(4001, () => {
  console.log("Comments API is running on port 4001");
});
