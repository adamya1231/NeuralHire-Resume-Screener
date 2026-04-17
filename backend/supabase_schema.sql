-- Supabase Initial Schema for Multi-Tenant ATS

-- 1. Create a table for Workspaces (Jobs/Campaigns)
CREATE TABLE workspaces (
    id SERIAL PRIMARY KEY,
    recruiter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    min_score INTEGER DEFAULT 75,
    public_token UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create a table for Candidates
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
    filename TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    education TEXT,
    overall_score INTEGER,
    match_category TEXT,
    experience_years TEXT,
    recommendation TEXT,
    raw_json JSONB, -- stores the full parsed response (top_strengths, skill_gaps, etc)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Note: We rely on Supabase Auth for 'recruiters' so auth.users is automatically joined.
