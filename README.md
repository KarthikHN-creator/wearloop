
# WearLoop 👕
### Good Style. Second Chances.

WearLoop is a MERN stack-based clothing swap marketplace that allows users to exchange pre-loved clothes and promote sustainable fashion.

## Features

- User registration and login
- Browse and discover clothing
- Search and filter clothing listings
- Add and manage clothing items
- Send and manage swap requests
- Chat between users
- User profiles
- Clothing value calculator
- Admin dashboard
- Notifications

## Tech Stack

**Frontend**
- React.js
- JavaScript
- HTML
- CSS
- Axios

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication

## Project Structure

```text
wearloop/
├── client/       # React frontend
├── server/       # Express backend
├── .gitignore
└── README.md
```

## Getting Started

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd wearloop
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

Create a `.env` file inside the server folder with the required environment variables.

### 3. Start the backend

```bash
npm start
```

### 4. Install frontend dependencies

Open another terminal:

```bash
cd client
npm install
npm run dev
```

## Environment Variables

Configure the required backend environment variables:

- `MONGO_URI`
- `JWT_SECRET`
- Any required Cloudinary credentials

Never upload your `.env` file or secret keys to GitHub.

## Project Goal

WearLoop aims to make clothing exchange easier, reduce clothing waste, and encourage people to reuse fashion through a community-driven platform.

## License

This project is currently developed as an educational and portfolio project.
