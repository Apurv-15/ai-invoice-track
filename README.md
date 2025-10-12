# 🤖 InvoSmart AI - AI-Powered Invoice Management System

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0+-blue.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-4.0+-yellow.svg)](https://vitejs.dev/)

> **Revolutionary AI-powered invoice automation system** that intelligently extracts, categorizes, and manages invoices using advanced machine learning models.

## 🚀 Features

### ✨ Core Features
- **🤖 AI-Powered Invoice Extraction** - Advanced OCR and vision AI for automatic data extraction
- **📊 Real-time Analytics Dashboard** - Live insights and spending analysis
- **👥 Multi-user Support** - Admin and user role management
- **📱 Responsive Design** - Works seamlessly on all devices
- **🌙 Dark Theme** - Modern dark interface by default
- **🔄 Real-time Updates** - Live synchronization across all sessions
- **📋 Smart Categorization** - AI-powered invoice categorization
- **💬 Reminder System** - User-admin communication system

### 🤖 AI Models & Technologies

#### **Primary AI Models**
- **🔍 Google Gemini 2.5 Flash** - Advanced vision and text analysis model
- **📝 OCR Engine** - Optical Character Recognition for text extraction
- **🎯 Smart Categorization** - Machine learning-based invoice classification
- **💡 Natural Language Processing** - Intelligent data interpretation

#### **AI Capabilities**
- **📄 Invoice Data Extraction** - Automatically extracts vendor, amount, date, description
- **🏷️ Smart Categorization** - Classifies invoices into predefined categories
- **🔍 Confidence Scoring** - Provides accuracy scores for extractions
- **🖼️ Image Processing** - Handles both images and PDF documents
- **📊 Pattern Recognition** - Identifies invoice patterns and structures

## 🛠️ Technology Stack

### **Frontend**
- **⚛️ React 18.2** - Modern React with hooks and concurrent features
- **📘 TypeScript** - Full type safety and enhanced developer experience
- **🎨 Tailwind CSS** - Utility-first CSS framework with custom design system
- **🧱 shadcn/ui** - High-quality, accessible UI components
- **⚡ Vite** - Lightning-fast build tool and development server

### **Backend & Database**
- **🗄️ Supabase** - Open source Firebase alternative
- **🔐 PostgreSQL** - Robust relational database with advanced features
- **🔒 Row Level Security (RLS)** - Database-level security policies
- **⚡ Real-time Subscriptions** - Live data synchronization
- **🔑 Authentication** - Built-in user authentication and authorization

### **AI & Processing**
- **🤖 Google Gemini AI** - State-of-the-art vision and language model
- **📋 PDF.js** - Client-side PDF processing and rendering
- **🖼️ Image Processing** - Advanced image manipulation and analysis
- **📊 Data Analytics** - Real-time dashboard and reporting

## 📦 Installation & Setup

### **Prerequisites**
- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** or **yarn** package manager
- **Supabase Account** - [Sign up at supabase.com](https://supabase.com)

### **Quick Start**

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd ai-invoice-aura

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Start development server
npm run dev

# 5. Apply database migrations
# Copy and run the SQL from /tmp/create_reminders_table.sql in Supabase SQL Editor
```

### **Environment Variables**

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
LOVABLE_API_KEY=your_lovable_api_key
```

## 🗄️ Database Schema

### **Core Tables**
- **`profiles`** - User profiles and authentication data
- **`user_roles`** - Role-based access control (admin/user)
- **`invoices`** - Invoice data with AI-extracted information
- **`invoice_categories`** - Categorization system for invoices
- **`reminders`** - User-admin communication system

### **AI Integration**
- **Real-time invoice processing** with vision AI
- **Automatic categorization** using machine learning
- **Confidence scoring** for extraction accuracy
- **Pattern recognition** for invoice structure detection

## 🎯 Usage Guide

### **For Users**
1. **📤 Upload Invoices** - Drag & drop or select invoice files (PDF, JPG, PNG)
2. **🤖 AI Processing** - Watch as AI extracts all invoice data automatically
3. **📊 View Dashboard** - Monitor spending, pending invoices, and analytics
4. **💬 Send Reminders** - Communicate with admins for assistance
5. **🔍 Track Status** - Real-time updates on invoice processing status

### **For Administrators**
1. **👥 User Management** - Manage user accounts and permissions
2. **📋 Invoice Review** - Review and approve/reject invoices
3. **📈 Analytics Dashboard** - Comprehensive spending and usage analytics
4. **🏷️ Category Management** - Manage invoice categories and rules
5. **💬 Reminder System** - Handle user inquiries and communications

## 🔧 Development

### **Project Structure**
```
src/
├── components/          # React components
│   ├── admin/          # Admin-specific components
│   ├── ui/             # Reusable UI components
│   └── *               # Feature components
├── pages/              # Route components
├── integrations/       # External service integrations
├── hooks/              # Custom React hooks
└── lib/                # Utility functions
```

### **Key Components**
- **`UploadSection`** - File upload with AI processing
- **`AnalyticsDashboard`** - Real-time analytics and charts
- **`UserReminders`** - User-admin communication system
- **`AdminReminders`** - Admin reminder management interface

### **AI Integration Points**
- **Invoice extraction** via Supabase Edge Functions
- **Category prediction** using trained ML models
- **Real-time processing** with WebSocket connections
- **Error handling** with fallback mechanisms

## 🚀 Deployment

### **Production Deployment**
1. **Build the application**: `npm run build`
2. **Deploy to hosting** (Vercel, Netlify, or custom hosting)
3. **Configure environment variables** in production
4. **Set up database** with production Supabase instance

### **Environment Setup**
- **Development**: Local Supabase instance or development project
- **Staging**: Separate Supabase project for testing
- **Production**: Production Supabase project with proper security

## 🔐 Security Features

- **Row Level Security (RLS)** - Database-level access control
- **Authentication** - Secure user authentication via Supabase
- **Authorization** - Role-based permissions (admin/user)
- **API Security** - Secure API key management for AI services
- **Data Encryption** - Secure data transmission and storage

## 📊 Performance Features

- **Real-time Updates** - Live data synchronization
- **Optimistic Updates** - Instant UI feedback
- **Lazy Loading** - Efficient resource loading
- **Caching** - Intelligent data caching strategies
- **Error Boundaries** - Graceful error handling

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- 📧 **Email**: support@invosmart.ai
- 💬 **Documentation**: [docs.invosmart.ai](https://docs.invosmart.ai)
- 🐛 **Issues**: [github.com/your-repo/issues](https://github.com/your-repo/issues)

---

**Built with ❤️ using cutting-edge AI technology**
