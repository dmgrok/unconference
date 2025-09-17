// Simplified Achievement System - Lean MVP
// Only 3 basic achievement types that deliver real value

export type AchievementType = 'first_topic' | 'active_participant' | 'event_host';

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: Date;
  eventId?: string;
}

export interface AchievementDefinition {
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  color: string;
  trigger: string;
  threshold: number;
}

// Simple achievement definitions - only meaningful ones
export const LEAN_ACHIEVEMENT_DEFINITIONS: Record<AchievementType, AchievementDefinition> = {
  'first_topic': {
    type: 'first_topic',
    title: 'Topic Creator',
    description: 'Submitted your first topic',
    icon: 'mdi-lightbulb',
    color: 'success',
    trigger: 'topics_created',
    threshold: 1
  },
  'active_participant': {
    type: 'active_participant',
    title: 'Active Participant',
    description: 'Voted on topics and joined discussions',
    icon: 'mdi-vote',
    color: 'primary',
    trigger: 'voting_participation',
    threshold: 1
  },
  'event_host': {
    type: 'event_host',
    title: 'Event Host',
    description: 'Created and ran an unconference event',
    icon: 'mdi-calendar-star',
    color: 'secondary',
    trigger: 'events_created',
    threshold: 1
  }
};

// User achievement progress tracking
export interface UserAchievementProgress {
  userId: string;
  eventId: string;
  achievements: Achievement[];
  progress: {
    topics_created: number;
    voting_participation: number;
    events_created: number;
  };
}