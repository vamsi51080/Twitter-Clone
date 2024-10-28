const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const jwt = require("jsonwebtoken");


let dbPath = path.join(__dirname, "twitterClone.db");

const app = express();
app.use(express.json());

const cors = require("cors");
app.use(cors());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Error message is '${e.message}'`);
    process.exit(1);
  }
};

initializeDbAndServer();

const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const getUserQuery = `select * from user where username = '${payload.username}'`;
        const dbUser = await db.get(getUserQuery);
        request.dbUser = dbUser;
        next();
      }
    });
  }
};

app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getUserQuery = `
    select * from user where username = '${username}';
    `;
  const dbUser = await db.get(getUserQuery);
  if (dbUser === undefined) {
    if (password.length < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const insertQuery = `
        insert into user(username,password, name, gender )
        values('${username}','${hashedPassword}', '${name}', '${gender}')
        `;
      await db.run(insertQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getUserQuery = `
    select * from user where username = '${username}';
    `;
  const dbUser = await db.get(getUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      console.log(jwtToken);
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.get("/user/", authenticateToken, async(request, response)=>{
  console.log(request.dbUser);
  response.send(request.dbUser);
})

app.get("/user/tweets/feed/", authenticateToken, async (request, response) => {
  //console.log(request.username);

  //console.log(request.dbUser);
  const getQuery = `
  SELECT user.username,
       tweet.tweet,
       tweet.date_time
FROM tweet
JOIN follower ON tweet.user_id = follower.following_user_id
JOIN user ON tweet.user_id = user.user_id
WHERE follower.follower_user_id = ${request.dbUser.user_id} -- replace ? with the user_id of the logged-in user
ORDER BY tweet.date_time DESC
LIMIT 4;
  `;
  const dbResponse = await db.all(getQuery);
  const formattedResponse = dbResponse.map((row) => ({
    username: row.username,
    tweet: row.tweet,
    dateTime: row.dateTime,
  }));

  response.send(formattedResponse);
});

app.get("/user/following/", authenticateToken, async (request, response) => {
  const getQuery = `
    SELECT user.name
    FROM follower
    JOIN user ON follower.following_user_id = user.user_id
    WHERE follower.follower_user_id = ${request.dbUser.user_id};  -- replace ? with the user_id of the logged-in user

    `;
  const dbResponse = await db.all(getQuery);
  response.send(dbResponse);
});

app.get("/user/followers/", authenticateToken, async (request, response) => {
  const getQuery = `
    SELECT user.name
    FROM follower
    JOIN user ON follower.follower_user_id = user.user_id
    WHERE follower.following_user_id = ${request.dbUser.user_id};  -- replace ? with the user_id of the specified user

    `;
  const dbResponse = await db.all(getQuery);
  response.send(dbResponse);
});

app.get("/tweets/:tweetId/", authenticateToken, async (request, response) => {
  const { tweetId } = request.params;
  const isAuthorizedQuery = `
    SELECT tweet.user_id
    FROM tweet
    JOIN follower ON tweet.user_id = follower.following_user_id
    WHERE tweet.tweet_id = ${tweetId} AND follower.follower_user_id = ${request.dbUser.user_id};
    `;
  const isAuthorized = await db.all(isAuthorizedQuery);
  if (isAuthorized.length === 0) {
    response.status(401);
    response.send("Invalid Request");
  } else {
    const getTweetQuery = `
        SELECT tweet.tweet,
       tweet.date_time AS dateTime,
       (SELECT COUNT(*) FROM like WHERE like.tweet_id = tweet.tweet_id) AS likes,
       (SELECT COUNT(*) FROM reply WHERE reply.tweet_id = tweet.tweet_id) AS replies
        FROM tweet
        WHERE tweet.tweet_id = ${tweetId};
        `;
    const dbResponse = await db.all(getTweetQuery);
    response.send(dbResponse[0]);
  }
});

app.get(
  "/tweets/:tweetId/likes/",
  authenticateToken,
  async (request, response) => {
    const { tweetId } = request.params;
    const isAuthorizedQuery = `
    SELECT tweet.user_id
    FROM tweet
    JOIN follower ON tweet.user_id = follower.following_user_id
    WHERE tweet.tweet_id = ${tweetId} AND follower.follower_user_id = ${request.dbUser.user_id};
    `;
    const isAuthorized = await db.all(isAuthorizedQuery);
    if (isAuthorized.length === 0) {
      response.status(401);
      response.send("Invalid Request");
    } else {
      const getDetailsQuery = `
    SELECT user.username
    FROM like
    JOIN user ON like.user_id = user.user_id
    WHERE like.tweet_id = ${tweetId};
    `;
      const dbResponse = await db.all(getDetailsQuery);
      const likes = dbResponse.map((row) => row.username);
      response.send({ likes });
    }
  }
);

app.get(
  "/tweets/:tweetId/replies/",
  authenticateToken,
  async (request, response) => {
    const { tweetId } = request.params;
    const isAuthorizedQuery = `
    SELECT tweet.user_id
    FROM tweet
    JOIN follower ON tweet.user_id = follower.following_user_id
    WHERE tweet.tweet_id = ${tweetId} AND follower.follower_user_id = ${request.dbUser.user_id};
    `;
    const isAuthorized = await db.all(isAuthorizedQuery);
    if (isAuthorized.length === 0) {
      response.status(401);
      response.send("Invalid Request");
    } else {
      const getDetailsQuery = `
    SELECT user.name,
       reply.reply
    FROM reply
    JOIN user ON reply.user_id = user.user_id
    WHERE reply.tweet_id = ${tweetId};

    `;
      const dbResponse = await db.all(getDetailsQuery);
      const formattedResponse = { replies: dbResponse };

      response.send(formattedResponse);
    }
  }
);

app.get("/user/tweets/", authenticateToken, async (request, response) => {
  const getQuery = `
    SELECT tweet.tweet,
       tweet.date_time AS dateTime,
       (SELECT COUNT(*) FROM like WHERE like.tweet_id = tweet.tweet_id) AS likes,
       (SELECT COUNT(*) FROM reply WHERE reply.tweet_id = tweet.tweet_id) AS replies
    FROM tweet
    WHERE tweet.user_id = ${request.dbUser.user_id}
    ORDER BY tweet.date_time DESC;

    `;
  const dbResponse = await db.all(getQuery);
  response.send(dbResponse);
});

app.post("/user/tweets/", authenticateToken, async (request, response) => {
  const { tweet } = request.body;
  console.log(tweet);
  const userId = request.dbUser.user_id;
  const insertQuery = `
    INSERT INTO tweet (tweet, user_id, date_time)
    VALUES ("${tweet}", ${userId}, datetime('now'));
    `;
  const dbResponse = await db.run(insertQuery);
  response.send("Created a Tweet");
});

app.delete(
  "/tweets/:tweetId/",
  authenticateToken,
  async (request, response) => {
    const { tweetId } = request.params;
    const userId = request.dbUser.user_id;
    const checkOwnershipQuery = `
    SELECT tweet_id
    FROM tweet
    WHERE tweet_id = ${tweetId} AND user_id = ${userId};
  `;
    const tweet = await db.get(checkOwnershipQuery);
    if (!tweet) {
      response.status(401);
      response.send("Invalid Request");
    } else {
      const deleteQuery = `
      DELETE FROM tweet
      WHERE tweet_id = ${tweetId};
    `;
      await db.run(deleteQuery);
      response.send("Tweet Removed");
    }
  }
);

module.exports = app;
