# Influencer Market Signals (IMS)

A professional platform that delivers real-time market-moving influencer mentions with sentiment analysis and ticker extraction.

## 🚀 Features

### Core Functionality
- **Real-time Market Signals**: Daily updates from 100+ finance influencers
- **Sentiment Analysis**: Bullish, bearish, or neutral sentiment for each mention
- **Ticker Extraction**: Automatic identification of stock symbols mentioned
- **Notable Timestamps**: Key moments with direct YouTube video links
- **Time-based Access**: Free users see 12-14 day old data, Pro users get same-day access

### User Experience
- **Dark Mode Interface**: Professional finance-grade aesthetic
- **Dashboard**: 14-day rolling timeline with trending tickers
- **Individual Day Pages**: Detailed view of all content from specific dates
- **Trending Tickers**: Dedicated page with time-based filtering
- **Account Management**: Profile settings and subscription management

### Admin Features
- **Content Ingestion**: YouTube URL processing with automatic transcript fetching
- **LLM Processing**: OpenAI-powered content analysis and extraction
- **User Management**: Pro status management for testing
- **Content Status**: Overview of all processed content

## 💰 Pricing Structure

### Bloomberg Anchor Pricing
- **Bloomberg Terminal**: $20,000/year (reference point)
- **IMS Pro Monthly**: $49/month (99.75% cheaper)
- **IMS Pro Annual**: $490/year (17% discount, "One good trade pays for the year")

### Access Levels
- **Free**: 12-14 day old data + all content older than 90 days (SEO)
- **Pro**: Same-day access to all content + full 14-day history

## 🛠 Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Firebase Auth** for authentication

### Backend
- **Next.js API Routes** for server-side logic
- **Firebase Firestore** for database
- **OpenAI GPT-4o-mini** for content processing
- **Stripe** for payment processing

### External APIs
- **YouTube Transcript API** for content extraction
- **YouTube Innertube API** for reliable transcript fetching

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/UFOBob069/influencermarketsignals.git
   cd influencermarketsignals
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   STRIPE_MONTHLY_PRICE_ID=price_your_monthly_plan_price_id
   STRIPE_ANNUAL_PRICE_ID=price_your_annual_plan_price_id
   NEXT_PUBLIC_BASE_URL=http://localhost:3000

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## 🔧 Setup Instructions

### Firebase Setup
1. Create a new Firebase project
2. Enable Authentication (Email/Password + Google)
3. Create a Firestore database
4. Add your Firebase config to `.env.local`

### Stripe Setup
1. Create a Stripe account
2. Create products for Monthly ($49) and Annual ($490) plans
3. Copy the Price IDs to your environment variables
4. See `STRIPE_SETUP.md` for detailed instructions

### OpenAI Setup
1. Get an OpenAI API key
2. Add it to your environment variables

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── digest/            # Email digest generation
│   │   ├── process-content/   # Content processing with LLM
│   │   ├── stripe/            # Payment processing
│   │   ├── user/              # User management
│   │   └── youtube/           # YouTube content ingestion
│   ├── dashboard/             # Main dashboard and day pages
│   ├── admin/                 # Admin panel
│   ├── account/               # User account management
│   ├── pricing/               # Pricing page
│   ├── signin/                # Authentication
│   └── signup/                # User registration
├── lib/                       # Utility functions and configs
│   ├── auth.tsx              # Authentication context
│   ├── firebase.ts           # Firebase configuration
│   └── fetchTranscript.ts    # YouTube transcript fetching
└── components/                # Reusable components
    └── SiteNav.tsx           # Global navigation
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to master

### Manual Deployment
1. Build the project: `npm run build`
2. Start production server: `npm start`

## 🔒 Security Features

- **Firebase Auth**: Secure user authentication
- **Pro Status Management**: Server-side access control
- **Time-based Gating**: Automatic content access restrictions
- **Stripe Integration**: Secure payment processing

## 📊 Data Flow

1. **Content Ingestion**: Admin submits YouTube URLs
2. **Transcript Fetching**: Automatic extraction using YouTube APIs
3. **LLM Processing**: OpenAI analyzes content for tickers, sentiment, highlights
4. **Storage**: Processed data stored in Firestore
5. **User Access**: Time-based gating based on user subscription status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for the trading community**
