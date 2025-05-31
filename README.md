# MarketPod Digest

MarketPod Digest is an AI-powered platform that automatically generates blog articles, tweet threads, and video summaries from finance podcasts. The platform uses OpenAI's GPT-4 for content generation and integrates with various APIs to create engaging, shareable content.

## Features

- YouTube link submission and processing
- Automatic content generation:
  - Blog articles
  - Tweet threads
  - Video summaries
- Real-time content status tracking
- SEO-optimized homepage
- Social sharing integration
- Newsletter subscription

## Tech Stack

- Frontend: Next.js 14 with App Router
- Backend: Next.js API Routes
- Database: Firebase Firestore
- Storage: Firebase Storage
- Authentication: Firebase Auth
- APIs:
  - OpenAI GPT-4
  - YouTube Transcript API
  - ElevenLabs (for voiceover)
  - Runway/Kaiber (for video generation)

## Prerequisites

- Node.js 18+ and npm
- Firebase account
- OpenAI API key
- YouTube API key
- ElevenLabs API key

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/marketpoddigest.git
   cd marketpoddigest
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key

   # YouTube API Configuration
   YOUTUBE_API_KEY=your_youtube_api_key

   # ElevenLabs Configuration
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```

4. Set up Firebase:
   - Create a new Firebase project
   - Enable Firestore and Storage
   - Add your web app to the project
   - Copy the configuration values to your `.env.local` file

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── admin/           # Admin dashboard
│   ├── api/            # API routes
│   ├── content/        # Content pages
│   └── components/     # Shared components
├── lib/
│   └── firebase.ts     # Firebase configuration
└── types/             # TypeScript types
```

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
