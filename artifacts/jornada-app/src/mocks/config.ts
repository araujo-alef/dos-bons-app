export type JourneyState = 'notStarted' | 'inProgress' | 'newLessonAvailable' | 'upToDate';

// Change this to test different hero states
export const JOURNEY_STATE: JourneyState = 'inProgress';

// Which lesson is currently in progress
export const CURRENT_LESSON_ID = 1;

// Which lessons have been fully completed
export const COMPLETED_LESSONS: number[] = [];
