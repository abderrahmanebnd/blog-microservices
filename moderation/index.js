const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

app.post("/events", (req, res) => {
  const { type, data } = req.body;

  if (type === "CommentCreated") {
    const status = data.content.includes("orange") ? "rejected" : "approved";

    axios
      .post("http://localhost:4005/events", {
        type: "CommentModerated",
        data: {
          ...data,
          status,
        },
      })
      .catch((err) => {
        console.error("Error sending CommentModerated event:", err.message);
      });
  }
  res.send({});
});

app.listen(4003, () => {
  console.log("moderation service is listening on 4003");
});
