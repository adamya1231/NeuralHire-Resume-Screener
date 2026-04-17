import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: Supabase URL or Key is missing. Database operations will fail.")

def get_supabase_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Recruiter Auth ---
def get_user_from_token(token):
    try:
        supabase = get_supabase_client()
        user = supabase.auth.get_user(token)
        return user.user
    except Exception as e:
        print("Auth error:", e)
        return None

# --- Workspaces ---
def get_all_workspaces(recruiter_id=None):
    supabase = get_supabase_client()
    query = supabase.table("workspaces").select("*").order("created_at", desc=True)
    if recruiter_id:
        query = query.eq("recruiter_id", recruiter_id)
    response = query.execute()
    return response.data

def get_workspace_by_token(public_token):
    supabase = get_supabase_client()
    response = supabase.table("workspaces").select("*").eq("public_token", public_token).execute()
    if len(response.data) > 0:
        return response.data[0]
    return None

def create_workspace(title, description, min_score=75, recruiter_id=None):
    supabase = get_supabase_client()
    data = {
        "title": title,
        "description": description,
        "min_score": min_score
    }
    if recruiter_id:
        data["recruiter_id"] = recruiter_id
        
    response = supabase.table("workspaces").insert(data).execute()
    if response.data and len(response.data) > 0:
        return response.data[0]["id"], response.data[0]["public_token"]
    return None, None

def update_workspace(workspace_id, title, description, min_score=75):
    supabase = get_supabase_client()
    data = {
        "title": title,
        "description": description,
        "min_score": min_score
    }
    supabase.table("workspaces").update(data).eq("id", workspace_id).execute()

def delete_workspace(workspace_id):
    supabase = get_supabase_client()
    # Supabase cascade delete handles candidates if foreign key is set correctly
    supabase.table("workspaces").delete().eq("id", workspace_id).execute()

# --- Candidates ---
def save_candidate(workspace_id, filename, llm_json, name=None, email=None, phone=None):
    supabase = get_supabase_client()
    
    c_data = llm_json.get("candidate", {})
    match_data = llm_json.get("match_details", {})
    
    final_name = name if name else c_data.get("name", "Unknown")
    
    candidate_record = {
        "workspace_id": workspace_id,
        "filename": filename,
        "name": final_name,
        "email": email,
        "phone": phone,
        "education": c_data.get("education", ""),
        "experience_years": str(c_data.get("experience_years", llm_json.get("experience_years", "Unknown"))),
        "overall_score": llm_json.get("overall_score", 0),
        "recommendation": llm_json.get("recommendation", llm_json.get("match_category", "UNKNOWN")),
        "raw_json": llm_json
    }
    
    response = supabase.table("candidates").insert(candidate_record).execute()
    
    if response.data and len(response.data) > 0:
        llm_json["id"] = response.data[0]["id"]
    return llm_json

def get_candidates_for_workspace(workspace_id):
    supabase = get_supabase_client()
    response = supabase.table("candidates").select("*").eq("workspace_id", workspace_id).order("overall_score", desc=True).execute()
    
    results = []
    for r in response.data:
        llm_json = r.get("raw_json", {})
        results.append({
            "id": r["id"],
            "candidate": {
                "name": r["name"],
                "role": llm_json.get("candidate", {}).get("role", "Unknown"),
            },
            "experience_years": r["experience_years"],
            "overall_score": r["overall_score"],
            "recommendation": r["recommendation"],
            "match_details": llm_json.get("match_details", {}),
            "top_strengths": llm_json.get("top_strengths", []),
            "skill_gaps": llm_json.get("skill_gaps", []),
            "suggested_interview_questions": llm_json.get("suggested_interview_questions", llm_json.get("interview_focus", [])),
            "bias_audit_log": llm_json.get("bias_audit_log", {}),
            "red_flags": llm_json.get("red_flags", []),
            "filename": r["filename"]
        })
    return results

def delete_candidate(candidate_id):
    supabase = get_supabase_client()
    supabase.table("candidates").delete().eq("id", candidate_id).execute()

def clear_workspace_candidates(workspace_id):
    supabase = get_supabase_client()
    supabase.table("candidates").delete().eq("workspace_id", workspace_id).execute()
