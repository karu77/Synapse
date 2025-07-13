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

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Synapse
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the backend directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   JWT_SECRET=your_jwt_secret_here
   MONGODB_URI=your_mongodb_connection_string
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

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

## API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout

### Graph Generation
- `POST /api/graph/generate` - Generate graphs from text, files, and documents

### History Management
- `GET /api/history` - Get user's graph history
- `DELETE /api/history/:id` - Delete specific history item
- `DELETE /api/history` - Clear all history

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

### Document Processing
- **pdf-parse** for PDF text extraction
- **mammoth** for Word document processing
- **Smart chunking** for large document handling
- **Metadata extraction** for enhanced context

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API documentation for technical details

---

**Synapse** - Transform your ideas into interactive knowledge networks with the power of AI. 
