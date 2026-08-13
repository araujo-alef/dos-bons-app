export type JourneyState = 'notStarted' | 'inProgress' | 'newChapterAvailable' | 'upToDate';

// Change this to test different hero states
export const JOURNEY_STATE: JourneyState = 'inProgress';

// Which chapter is currently in progress
export const CURRENT_CHAPTER_ID = 6;

// Which chapters have been fully completed
export const COMPLETED_CHAPTERS = [1, 2, 3, 4, 5];
