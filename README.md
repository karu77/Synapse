# Synapse: Real-time Graph Intelligence

Welcome to Synapse! This is a modern web application that transforms text and multimodal inputs (images, audio) into interactive knowledge graphs in real-time using advanced AI capabilities from Google's Gemini.

## Live Demo

https://synapse-lac.vercel.app


## Features

-   **Real-time Text-to-Graph Conversion**: Instantly see entities and their connections visualized.
-   **Multimodal Input Support**: Analyze text, images, and audio/video files to build comprehensive graphs.
-   **Interactive Graph Visualization**: Drag, zoom, and explore the knowledge graph. Click on nodes to get more information.
-   **AI-Powered Analysis**: Uses the Gemini API for entity recognition, relationship extraction, and sentiment analysis.
-   **User Accounts & History**: Securely sign up, log in, and view your past graph generations.
-   **Customizable Experience**: Adjust graph physics and visual styles to your liking.
-   **Light & Dark Mode**: A beautiful UI that respects your system's theme preference.

## Tech Stack

-   **Frontend**:
    -   React (with Vite)
    -   Tailwind CSS for styling and theming
    -   `vis-network` for interactive graph visualization
    -   Axios for API communication
    -   React Router for navigation
-   **Backend**:
    -   Node.js with Express
    -   Google Generative AI SDK (Gemini 1.5 Flash)
    -   MongoDB with Mongoose for database storage
    -   JSON Web Tokens (JWT) for secure authentication
    -   Multer for handling file uploads

## Getting Started (For Developers)

Follow these instructions to get the project running on your local machine for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher recommended)
-   [npm](https://www.npmjs.com/) (v8 or higher)
-   [Git](https://git-scm.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/karu77/Synapse.git
    cd synapse
    ```

2.  **Install all dependencies for both frontend and backend:**
    From the root directory, run:
    ```bash
    npm run install:all
    ```
    This command will install dependencies listed in the root `package.json` and then automatically run `npm install` in both the `frontend` and `backend` directories.

### Configuration

You will need to set up environment variables for both the backend and frontend. We've provided example files to make this easy.

#### Backend Configuration

1.  Navigate to the `backend` directory.
2.  Create a `.env` file by copying the example: `cp backend/example.env backend/.env` (on Mac/Linux) or by renaming the file manually (on Windows).
3.  Open the new `backend/.env` file and fill in the values:

    ```env
    PORT=3000
    GEMINI_API_KEY="your_gemini_api_key_here"
    MONGO_URI="your_mongodb_connection_string_here"
    JWT_SECRET="a_long_random_secure_string_for_jwt"
    ```
    -   `GEMINI_API_KEY`: Get your key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    -   `MONGO_URI`: This is your connection string for a MongoDB database. You can get a free one from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
    -   `JWT_SECRET`: Create a long, random, and secure string. This is used to sign authentication tokens.

#### Frontend Configuration

1.  Navigate to the `frontend` directory.
2.  Create a `.env` file by copying the example: `cp frontend/example.env frontend/.env`.
3.  The `.env` file contains the base URL for the backend API. The default value should work for local development.
    ```env
    VITE_API_BASE_URL=http://localhost:3000
    ```

### Running the Application

Once you have installed dependencies and configured your environment variables, you can start the application.

From the **root directory** of the project, run:
```bash
npm start
```

This single command uses `concurrently` to:
-   Start the backend server on `http://localhost:3000` (by default).
-   Start the frontend Vite development server on `http://localhost:5173` (by default).

Your browser should automatically open to the application, or you can navigate to `http://localhost:5173` yourself.

## How It Works

1.  **Authentication**: Users must first register for an account and log in. Sessions are managed with JWTs stored in browser local storage.
2.  **Input**: On the main dashboard, you can input text, upload an image file, and upload an audio/video file (or provide a URL).
3.  **Generation**: Clicking "Generate Graph" sends the inputs to the backend.
4.  **AI Processing**: The backend sends a carefully constructed prompt, along with any multimodal data, to the Gemini API.
5.  **Graph Creation**: The API returns a JSON object containing identified entities and their relationships, which is then sent back to the frontend.
6.  **Visualization**: The frontend renders the data as an interactive graph.
7.  **History**: Each successful generation is saved to the user's history for later viewing.

## Deployment (For End-Users)

To make this application accessible to anyone on the web, you need to deploy the frontend and backend to hosting services.

-   **Frontend (React App)**:
    -   **Provider**: Services like [Vercel](https://vercel.com/), [Netlify](https://www.netlify.com/), or [AWS Amplify](https://aws.amazon.com/amplify/) are excellent for hosting modern React applications.
    -   **Process**:
        1.  Connect your Git repository to the provider.
        2.  Configure the build command: `npm run build` (within the `frontend` directory).
        3.  Set the publish directory: `frontend/dist`.
        4.  Add your `VITE_API_BASE_URL` environment variable, pointing to your deployed backend's URL.

-   **Backend (Node.js/Express App)**:
    -   **Provider**: Services like [Render](https://render.com/), [Heroku](https://www.heroku.com/), or a traditional VPS (e.g., DigitalOcean, AWS EC2) are suitable.
    -   **Process**:
        1.  Connect your Git repository.
        2.  Set the start command: `npm start`.
        3.  Ensure your `package.json`'s `start` script runs the compiled JavaScript (e.g., `node dist/server.js`). The current configuration is correct.
        4.  Add your `GEMINI_API_KEY`, `MONGO_URI`, and `JWT_SECRET` environment variables in the provider's dashboard.
        5.  **Crucially**, add a `FRONTEND_URL` environment variable and set it to the full URL of your deployed frontend (e.g., `https://your-app-name.vercel.app`). This is required for security.

## License

This project is licensed under the MIT License. 
