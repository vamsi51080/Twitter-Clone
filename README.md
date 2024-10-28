# Twitter Clone API

A full-featured RESTful API for a Twitter-like application, built using **Node.js**, **Express.js**, and **SQLite**. This API allows for secure user authentication, tweet management, and social interactions, replicating core functionalities of a social media platform.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Installation](#installation)
5. [Environment Variables](#environment-variables)
6. [API Documentation](#api-documentation)
7. [Testing](#testing)
8. [Future Scope](#future-scope)

## Project Overview

The Twitter Clone API enables users to:
- Register and log in securely using **JWT authentication**
- Follow and unfollow other users
- Create, like, and reply to tweets
- View tweet feeds, followers, and following lists

This project is designed to simulate the backend of a social media application, providing all necessary endpoints to support user interactions and tweet management.

## Features

- User Registration and Login with **JWT-based authentication**
- CRUD operations for tweets, likes, and replies
- Follow/unfollow functionality
- Secure endpoint access with **middleware** for authentication and error handling
- Testing and debugging facilitated with **HTTP Client** using `.http` files

## Tech Stack

- **Node.js**
- **Express.js**
- **SQLite** for database management
- **JWT** for secure authentication
- **HTTP Client (.http files)** for API testing

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/twitter-clone-api.git
   cd twitter-clone-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the SQLite database:
   - Ensure `twitterClone.db` is in the root directory.

4. Start the server:
   ```bash
   npm start
   ```

## Environment Variables

Create a `.env` file in the root directory and add the following:

```plaintext
PORT=3000
JWT_SECRET=your_jwt_secret_key
```

## API Documentation

### User Routes

- **Register**  
  `POST /register/` - Registers a new user.
  
- **Login**  
  `POST /login/` - Authenticates user and returns JWT token.

### Tweet Routes

- **Get Tweets Feed**  
  `GET /user/tweets/feed/` - Retrieves tweets from followed users.

- **Create Tweet**  
  `POST /user/tweets/` - Creates a new tweet.

- **Delete Tweet**  
  `DELETE /tweets/:tweetId/` - Deletes a user’s tweet.

### Follow/Unfollow Routes

- **Following List**  
  `GET /user/following/` - Lists users that the authenticated user follows.

- **Followers List**  
  `GET /user/followers/` - Lists users that follow the authenticated user.

For detailed documentation on each API endpoint, please refer to [API Documentation](docs/api.md).

## Testing

Testing can be done with `.http` files:
- Test individual API endpoints by running requests from the `.http` file in Visual Studio Code with REST Client extension.
- Examples of requests are provided in `tests/api_requests.http`.

## Future Scope

- Integrate **WebSocket** for real-time updates on likes, replies, and followers.
- Add **GraphQL** for more efficient and flexible data querying.
- Implement **analytics** on user engagement to provide insights into tweet performance and user activity trends.

## Contributing

Contributions are welcome! Please create an issue or submit a pull request with suggestions or improvements.

