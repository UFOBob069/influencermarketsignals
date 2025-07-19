declare module 'youtube-captions-scraper' {
  interface GetSubtitlesOptions {
    videoID: string;
    lang?: string;
  }

  interface TranscriptSegment {
    text: string;
    start: number;
    duration: number;
  }

  export function getSubtitles(options: GetSubtitlesOptions): Promise<TranscriptSegment[]>;
} 