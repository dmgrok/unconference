-- Phase 1: Connection & Collaboration Database Schema

-- Extend existing users table with connection-related fields
ALTER TABLE users ADD COLUMN skills TEXT[]; -- Array of skills
ALTER TABLE users ADD COLUMN interests TEXT[]; -- Array of interests  
ALTER TABLE users ADD COLUMN looking_for TEXT[]; -- What they're seeking
ALTER TABLE users ADD COLUMN linkedin_url TEXT;
ALTER TABLE users ADD COLUMN twitter_handle TEXT;
ALTER TABLE users ADD COLUMN website_url TEXT;
ALTER TABLE users ADD COLUMN allow_contact_sharing BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN bio TEXT;

-- Track connections between participants
CREATE TABLE event_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  participant_a UUID NOT NULL,
  participant_b UUID NOT NULL,
  shared_topics TEXT[], -- Topics both voted for
  collaborated_on TEXT[], -- Rooms/topics worked on together
  contact_exchanged BOOLEAN DEFAULT false,
  connection_strength INTEGER DEFAULT 1, -- 1-5 scale
  meeting_notes TEXT,
  follow_up_planned BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (participant_a) REFERENCES users(id),
  FOREIGN KEY (participant_b) REFERENCES users(id),
  UNIQUE(event_id, participant_a, participant_b)
);

-- Collaboration spaces for topics
CREATE TABLE collaboration_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  topic_id UUID,
  room_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  contributors UUID[], -- Array of participant IDs
  shared_notes TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on-hold')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Resources shared in collaborations
CREATE TABLE collaboration_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT DEFAULT 'link' CHECK (resource_type IN ('link', 'document', 'tool', 'article')),
  added_by UUID NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  votes INTEGER DEFAULT 0,
  
  FOREIGN KEY (collaboration_id) REFERENCES collaboration_spaces(id) ON DELETE CASCADE,
  FOREIGN KEY (added_by) REFERENCES users(id)
);

-- Action items from collaborations
CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID NOT NULL,
  task TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL,
  due_date TIMESTAMP,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  FOREIGN KEY (collaboration_id) REFERENCES collaboration_spaces(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Work showcases from events
CREATE TABLE work_showcases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  description TEXT NOT NULL,
  contributors UUID[], -- Array of participant IDs
  skills_used TEXT[],
  skills_needed TEXT[],
  status TEXT DEFAULT 'ideation' CHECK (status IN ('ideation', 'active', 'completed', 'seeking-collaborators')),
  contact_email TEXT,
  repository_url TEXT,
  demo_url TEXT,
  images TEXT[], -- Array of image URLs
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Introduction requests
CREATE TABLE introduction_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  requester_id UUID NOT NULL,
  target_person_id UUID NOT NULL,
  reason TEXT NOT NULL,
  common_interests TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  facilitated_by UUID, -- NULL for system-generated
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (target_person_id) REFERENCES users(id),
  FOREIGN KEY (facilitated_by) REFERENCES users(id)
);

-- User achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('connection', 'collaboration', 'knowledge', 'community')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT 'mdi-trophy',
  badge_url TEXT,
  earned_at TIMESTAMP DEFAULT NOW(),
  event_id UUID, -- NULL for global achievements
  metadata JSONB, -- Store additional data like counts, scores, etc.
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, achievement_type, name, event_id)
);

-- Skill matches for introductions
CREATE TABLE skill_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  person_a UUID NOT NULL,
  person_b UUID NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('complement', 'shared-interest', 'mentor-mentee')),
  skills TEXT[],
  compatibility_score DECIMAL(3,2), -- 0.00 to 1.00
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (person_a) REFERENCES users(id),
  FOREIGN KEY (person_b) REFERENCES users(id),
  UNIQUE(event_id, person_a, person_b)
);

-- Indexes for performance
CREATE INDEX idx_event_connections_event_id ON event_connections(event_id);
CREATE INDEX idx_event_connections_participants ON event_connections(participant_a, participant_b);
CREATE INDEX idx_collaboration_spaces_event_id ON collaboration_spaces(event_id);
CREATE INDEX idx_collaboration_resources_collab_id ON collaboration_resources(collaboration_id);
CREATE INDEX idx_action_items_collab_id ON action_items(collaboration_id);
CREATE INDEX idx_action_items_assigned_to ON action_items(assigned_to);
CREATE INDEX idx_work_showcases_event_id ON work_showcases(event_id);
CREATE INDEX idx_introduction_requests_requester ON introduction_requests(requester_id);
CREATE INDEX idx_introduction_requests_target ON introduction_requests(target_person_id);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_skill_matches_event_id ON skill_matches(event_id);
CREATE INDEX idx_skill_matches_persons ON skill_matches(person_a, person_b);

-- Functions for common queries
CREATE OR REPLACE FUNCTION get_user_connections(user_id UUID, event_id UUID)
RETURNS TABLE(
  connection_id UUID,
  other_person_id UUID,
  other_person_name TEXT,
  other_person_avatar TEXT,
  shared_topics TEXT[],
  collaborated_on TEXT[],
  connection_strength INTEGER,
  contact_exchanged BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ec.id as connection_id,
    CASE 
      WHEN ec.participant_a = user_id THEN ec.participant_b 
      ELSE ec.participant_a 
    END as other_person_id,
    u.name as other_person_name,
    u.avatar as other_person_avatar,
    ec.shared_topics,
    ec.collaborated_on,
    ec.connection_strength,
    ec.contact_exchanged
  FROM event_connections ec
  JOIN users u ON (
    CASE 
      WHEN ec.participant_a = user_id THEN ec.participant_b 
      ELSE ec.participant_a 
    END = u.id
  )
  WHERE (ec.participant_a = user_id OR ec.participant_b = user_id)
    AND ec.event_id = get_user_connections.event_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION suggest_connections(user_id UUID, event_id UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE(
  person_id UUID,
  person_name TEXT,
  person_avatar TEXT,
  match_type TEXT,
  skills TEXT[],
  compatibility_score DECIMAL,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN sm.person_a = user_id THEN sm.person_b 
      ELSE sm.person_a 
    END as person_id,
    u.name as person_name,
    u.avatar as person_avatar,
    sm.match_type,
    sm.skills,
    sm.compatibility_score,
    sm.reason
  FROM skill_matches sm
  JOIN users u ON (
    CASE 
      WHEN sm.person_a = user_id THEN sm.person_b 
      ELSE sm.person_a 
    END = u.id
  )
  WHERE (sm.person_a = user_id OR sm.person_b = user_id)
    AND sm.event_id = suggest_connections.event_id
  ORDER BY sm.compatibility_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
