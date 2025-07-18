# Synapse: Real-time Graph Intelligence

A powerful web application that generates interactive knowledge graphs, flowcharts, and mind maps from text, images, audio, and documents using AI.

## Features

### 🧠 AI-Powered Graph Generation
- **Knowledge Graphs**: Explore entities and their relationships in interconnected networks
- **Flowcharts**: Visualize processes, code logic, decisions, and workflows step-by-step
- **Mind Maps**: Organize ideas hierarchically around central topics with multiple layout options

### 📄 Document Analysis
- **PDF Support**: Extract and analyze content from PDF documents
- **Word Documents**: Process .doc and .docx files
- **Text Files**: Handle plain text, markdown, and CSV files
- **Smart Extraction**: Automatically extract text content and metadata for graph generation

### 🎨 Interactive Visualizations
- **Real-time Physics**: Dynamic graph layouts with customizable physics settings
- **Multiple Layouts**: Support for hierarchical, radial, and organizational structures
- **Custom Styling**: Extensive customization options for colors, shapes, and spacing
- **Responsive Design**: Works seamlessly across desktop and mobile devices

### 🔍 Advanced Features
- **Multi-modal Input**: Combine text, images, audio, and documents
- **Context-Aware AI**: Intelligent analysis based on input type and content
- **Export Options**: Download graphs as SVG, JSON, or CSV formats
- **History Management**: Save and revisit previous graph generations
- **Search & Filter**: Find specific nodes and relationships within graphs

---

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key
- MongoDB Atlas or local MongoDB instance

---

## Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Synapse
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Environment Setup**
   - Create a `.env` file in the `backend` directory:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     JWT_SECRET=your_jwt_secret_here
     MONGO_URI=your_mongodb_connection_string
     NODE_ENV=development
     FRONTEND_URL=http://localhost:5173
     # Email/SMTP settings for verification emails
     SMTP_HOST=smtp.yourprovider.com
     SMTP_PORT=587
     SMTP_USER=your@email.com
     SMTP_PASS=your_email_password_or_app_password
     FROM_EMAIL=your@email.com
     ```
     - For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833?hl=en) if 2FA is enabled.

4. **Start the development servers**
   ```bash
   # Start backend (from backend directory)
   npm run dev
   # Start frontend (from frontend directory)
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3002

---

## Deployment

### Backend on Render
1. Push your backend code to GitHub.
2. Go to [Render.com](https://render.com/) and create a new Web Service.
3. Set the root directory to `/backend` if needed.
4. **Build Command:**
   ```
   npm install && npm run build
   ```
5. **Start Command:**
   ```
   npm run start
   ```
6. **Environment Variables:** Add all from your `.env` (see above).
7. Deploy and note your Render backend URL (e.g., `https://your-backend.onrender.com`).

### Frontend on Vercel
1. Push your frontend code to GitHub.
2. Go to [Vercel.com](https://vercel.com/) and create a new project.
3. Set the root directory to `/frontend` if needed.
4. **Build Command:**
   ```
   npm run build
   ```
5. **Output Directory:**
   ```
   dist
   ```
6. **Environment Variables:**
   - `VITE_API_BASE_URL=https://your-backend.onrender.com`
   - `VITE_API_URL=/api`
7. Deploy and note your Vercel frontend URL (e.g., `https://your-frontend.vercel.app`).

### Final Steps
- Update your backend's `FRONTEND_URL` env variable on Render to your Vercel frontend URL.
- Make sure CORS is enabled for your frontend domain in the backend.
- Test registration, login, and all features.

---

## Usage

### Basic Graph Generation
1. Select a diagram type (Knowledge Graph, Flowchart, or Mind Map)
2. Enter text or ask a question
3. Optionally upload images, audio files, or documents
4. Click "Generate" to create your visualization

### Document Analysis
1. Upload a document file (PDF, Word, or text file)
2. The system will automatically extract text content
3. Add additional context with text input or questions
4. Generate graphs that represent the document's key concepts and relationships

### Customization
- **Physics Settings**: Adjust gravitational constant, spring length, and damping
- **Visual Styles**: Customize colors, shapes, and spacing for different node types
- **Layout Options**: Choose from traditional, radial, organizational, and timeline layouts for mind maps

---

## API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout
- `POST /api/users/send-verification` - Send verification email
- `POST /api/users/verify-email` - Verify email OTP

### Graph Generation
- `POST /api/graph/generate` - Generate graphs from text, files, and documents

### History Management
- `GET /api/history` - Get user's graph history
- `DELETE /api/history/:id` - Delete specific history item
- `DELETE /api/history` - Clear all history

---

## File Format Support

### Documents
- **PDF** (.pdf) - Full text extraction with metadata
- **Word** (.doc, .docx) - Document content and formatting
- **Text** (.txt, .md, .csv) - Plain text and structured data

### Media
- **Images** - JPEG, PNG, GIF, WebP
- **Audio/Video** - MP3, MP4, WAV, AVI (up to 10MB)

### Export Formats
- **SVG** - Vector graphics for presentations
- **JSON** - Raw graph data for further processing
- **CSV** - Tabular data for analysis

---

## Architecture

### Frontend
- **React 18** with modern hooks and context
- **Framer Motion** for smooth animations
- **Tailwind CSS** for responsive styling
- **React Flow** for graph visualization
- **Axios** for API communication

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** with Mongoose for data persistence
- **Google Gemini AI** for content analysis
- **Multer** for file upload handling
- **JWT** for authentication
- **Nodemailer** for email verification

### Document Processing
- **pdf-parse** for PDF text extraction
- **mammoth** for Word document processing
- **Smart chunking** for large document handling
- **Metadata extraction** for enhanced context

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API documentation for technical details

---

**Synapse** - Transform your ideas into interactive knowledge networks with the power of AI. 
