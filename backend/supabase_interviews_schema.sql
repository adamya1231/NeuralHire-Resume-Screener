-- AI Interview Round: Supabase Schema
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS interviews (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    candidate_email TEXT,
    candidate_name TEXT,
    interview_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',  -- pending | in_progress | completed
    questions JSONB,                -- Array of {id, question, difficulty, topic}
    answers JSONB,                  -- Array of {question_id, answer}
    question_scores JSONB,          -- Array of {question_id, score, feedback, demonstrated_concepts}
    overall_score INTEGER,
    ai_feedback JSONB,              -- {overall_feedback, interview_recommendation, key_strengths, knowledge_gaps}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS (Row Level Security) - allow public read by token
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (for candidates to take interview)
CREATE POLICY "Public interview read by token"
    ON interviews FOR SELECT
    USING (true);

-- Policy: Allow public insert for submissions (service role bypasses this anyway)
CREATE POLICY "Allow interview submissions"
    ON interviews FOR UPDATE
    USING (true);

-- Policy: Allow service role full access (backend uses anon key which should be service key for inserts)
CREATE POLICY "Allow inserts"
    ON interviews FOR INSERT
    WITH CHECK (true);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS interviews_token_idx ON interviews(interview_token);
CREATE INDEX IF NOT EXISTS interviews_workspace_idx ON interviews(workspace_id);
CREATE INDEX IF NOT EXISTS interviews_candidate_idx ON interviews(candidate_id);
