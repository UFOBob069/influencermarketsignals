# Influencer Market Signals

A professional platform that delivers market-moving influencer mentions in real-time, paired with short audio/video snippets.

## Features

- **Real-time Market Signals**: Track mentions of stocks from top finance influencers
- **Time-based Access**: Free users see 14-day-old data, Pro users get same-day access
- **Admin Panel**: Upload YouTube videos for automatic transcript processing
- **Dashboard**: 14-day timeline with trending tickers and sentiment analysis
- **Email Digests**: Daily summaries for both free and Pro users

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes, Firebase (Firestore, Auth)
- **AI Processing**: OpenAI GPT-4o-mini for content analysis
- **Transcript Service**: YouTube Innertube API (most reliable method) + Node.js fallback

## Setup

### Prerequisites

- Node.js 18+
- Firebase project
- OpenAI API key

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository>
   cd influencermarketsignals
   npm install
   ```

2. **Environment variables**:
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

## Usage

### Admin Panel

1. Navigate to `/admin` and sign in
2. Paste a YouTube URL in the form
3. The system will:
   - Fetch the video transcript using YouTube's Innertube API
   - Extract metadata (title, channel, subscribers, etc.)
   - Process content with OpenAI for ticker mentions and sentiment
   - Store results in Firestore

### Dashboard

- View trending tickers on a 14-day timeline
- Free users can only access data from exactly 14 days ago
- Pro users can access all data including real-time updates
- Click on tickers to see detailed mentions and snippets

## Architecture

### Transcript Processing

The system uses YouTube's own Innertube API for maximum reliability:

- **Primary**: YouTube Innertube API (YouTube's internal API)
- **Fallback**: Node.js youtube-transcript library
- **Multiple Languages**: Tries en, en-US, en-GB, en-CA
- **Features**: 
  - Uses YouTube's own API (most reliable)
  - Android client impersonation for better access
  - XML caption parsing with timestamps
  - Graceful fallback system

### Content Flow

1. **Ingest**: YouTube URL → Innertube API → transcript + metadata
2. **Process**: OpenAI analysis → ticker mentions, sentiment, highlights
3. **Store**: Firestore → structured data for dashboard
4. **Display**: Dashboard → timeline view with gating logic

## Development

### Running the App

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start
```

### API Endpoints

- `POST /api/youtube/ingest` - Process YouTube videos
- `POST /api/process-content` - AI content analysis
- `GET /api/digest` - Generate email digests

## Deployment

### Vercel (Recommended)

The Next.js app can be deployed directly to Vercel:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

- **Netlify**: Works with Next.js static export
- **Railway**: Full-stack deployment
- **DigitalOcean App Platform**: Managed deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run build`
5. Submit a pull request

## License

MIT License
