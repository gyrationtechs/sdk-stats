# 📊 Sendlayer SDK Statistics Dashboard

A comprehensive real-time dashboard for tracking download statistics across all Sendlayer SDK platforms. Built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

### **Multi-Platform Support**
- **Python SDK** - PyPI download statistics
- **Node.js SDK** - NPM download statistics  
- **PHP SDK** - Packagist download statistics
- **Ruby SDK** - RubyGems download statistics

### **Interactive Filtering**
- **Time Period Filters** - Switch between daily, weekly, and monthly views
- **Custom Date Range** - Select specific date ranges for detailed analysis
- **Real-time Updates** - Dashboard automatically refreshes when filters are applied


## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sdk-stats
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
sdk-stats/
├── app/
│   ├── api/stats/          # API routes for each SDK
│   │   ├── python/         # PyPI statistics
│   │   ├── nodejs/         # NPM statistics
│   │   ├── php/            # Packagist statistics
│   │   └── ruby/           # RubyGems statistics
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main dashboard page
├── components/
│   ├── DateRangeFilter.tsx # Date range picker component
│   ├── FilterButtons.tsx   # Time period filter buttons
│   ├── RubySection.tsx     # Ruby-specific stats display
│   └── SDKCard.tsx         # Individual SDK statistics card
├── lib/
│   └── api.ts              # API client functions
└── public/                 # Static assets
```

## 🚀 Deployment

### **Vercel (Recommended)**
```bash
npm run build
vercel --prod
```

### **Other Platforms**
```bash
npm run build
npm start
```

## 📊 Usage

1. **View Default Stats** - Dashboard loads with recent statistics
2. **Filter by Period** - Click Day/Week/Month buttons
3. **Apply Date Range** - Select custom start and end dates
4. **Reset Filters** - Click Reset to return to default view

## 🔍 Troubleshooting

### **Common Issues**
- **API Errors**: Check browser console for detailed error messages
- **Date Range Issues**: Ensure date format is YYYY-MM-DD
- **Loading States**: Dashboard shows loading indicator during API calls

