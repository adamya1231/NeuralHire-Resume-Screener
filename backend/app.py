import os
import json
import fitz  # PyMuPDF
import time
import concurrent.futures
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Database and Prompts
import database
from prompts import HACKATHON_PARSE_AND_SCORE

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

def extract_text_from_pdf(file_bytes):
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return ""

def call_llm(prompt_text):
    api_key_anthropic = os.getenv("ANTHROPIC_API_KEY")
    api_key_gemini = os.getenv("GEMINI_API_KEY")

    if api_key_anthropic:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=api_key_anthropic)
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt_text}]
            )
            content = response.content[0].text
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            return json.loads(content.strip())
        except Exception as e:
            if "429" in str(e): raise e
            print("Anthropic API Error:", e)
            return {"candidate": {"name": "API ERROR"}, "overall_score": 0, "recommendation": "ERROR", "match_details": {}, "top_strengths": ["API Failed"], "skill_gaps": [str(e)], "interview_focus": [], "bias_check": ""}
            
    if api_key_gemini:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key_gemini)
            model = genai.GenerativeModel('gemini-3-flash-preview')
            
            response = model.generate_content(
                prompt_text,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json"
                )
            )
            content = response.text
            
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
                
            return json.loads(content.strip())
        except Exception as e:
            if "429" in str(e): raise e
            print("Gemini API Error:", e)
            return {"candidate": {"name": "API ERROR"}, "overall_score": 0, "match_category": "ERROR", "top_strengths": ["API Failed"], "skill_gaps": [str(e)], "suggested_interview_questions": [], "bias_audit_log": {}, "red_flags": []}

    # ---------------------------------------------------------
    # FALLBACK
    # ---------------------------------------------------------
    return {
      "candidate": {
         "name": "Candidate Analyzed",
         "email": "test@example.com",
         "phone": "555-1234",
         "education": "National Institute"
      },
      "overall_score": 88,
      "match_category": "High Match",
      "experience_years": "4.5",
      "top_strengths": ["Strong problem solving", "Relevant tech stack match"],
      "skill_gaps": ["Lacking direct CI/CD pipeline setup experience"],
      "suggested_interview_questions": ["Ask about scaling databases"],
      "bias_audit_log": {"name_visible": True, "college_anonymised": True},
      "red_flags": []
    }

def process_single_resume(idx, file_bytes, filename, job_description):
    resume_text = extract_text_from_pdf(file_bytes)
    formatted_prompt = HACKATHON_PARSE_AND_SCORE.format(
        resume_text=resume_text[:4000],
        jd_text=job_description[:2000]
    )
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            llm_json = call_llm(formatted_prompt)
            if llm_json["candidate"]["name"] == "Candidate Analyzed" or "Extract Candidate Name" in llm_json["candidate"]["name"]:
                llm_json["candidate"]["name"] = filename.replace(".pdf", "").title()
            
            # The id will be set by the DB later, but we can temporarily store filename
            llm_json["filename"] = filename
            return llm_json
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"Rate limited on {filename}, sleeping for {2 * (attempt + 1)} seconds...")
                time.sleep(2 * (attempt + 1))
            else:
                return {
                    "filename": filename,
                    "candidate": {"name": filename.replace(".pdf", "").title()}, "overall_score": 0, "match_category": "ERROR: Limit", 
                    "top_strengths": ["API Failed"], "skill_gaps": [str(e)], "suggested_interview_questions": [], "bias_audit_log": {}, "red_flags": []
                }

# --- Workspace Endpoints ---

@app.route('/api/workspaces', methods=['GET'])
def get_workspaces():
    workspaces = database.get_all_workspaces()
    return jsonify({"workspaces": workspaces})

@app.route('/api/workspaces', methods=['POST'])
def create_workspace():
    data = request.json
    title = data.get('title')
    description = data.get('description')
    min_score = int(data.get('min_score', 75))
    if not title or not description:
        return jsonify({"error": "Missing title or description"}), 400
    w_id, public_token = database.create_workspace(title, description, min_score)
    return jsonify({"id": w_id, "workspace_id": w_id, "public_token": public_token, "title": title, "description": description, "min_score": min_score}), 201
@app.route('/api/workspaces/<int:workspace_id>/candidates', methods=['GET'])
def get_workspace_candidates(workspace_id):
    candidates = database.get_candidates_for_workspace(workspace_id)
    return jsonify({"candidates": candidates})

@app.route('/api/workspaces/<int:workspace_id>', methods=['PUT'])
def update_workspace_endpoint(workspace_id):
    data = request.json
    title = data.get('title')
    description = data.get('description')
    min_score = int(data.get('min_score', 75))
    if not title or not description:
        return jsonify({"error": "Missing title or description"}), 400
    
    database.update_workspace(workspace_id, title, description, min_score)
    return jsonify({"success": True}), 200

@app.route('/api/workspaces/<int:workspace_id>', methods=['DELETE'])
def delete_workspace_endpoint(workspace_id):
    database.delete_workspace(workspace_id)
    return jsonify({"success": True}), 200

@app.route('/api/workspaces/<int:workspace_id>/candidates', methods=['DELETE'])
def clear_workspace_candidates_endpoint(workspace_id):
    database.clear_workspace_candidates(workspace_id)
    return jsonify({"success": True}), 200

@app.route('/api/candidates/<int:candidate_id>', methods=['DELETE'])
def delete_candidate_endpoint(candidate_id):
    database.delete_candidate(candidate_id)
    return jsonify({"success": True}), 200

# --- Public Candidate Application Endpoint ---

@app.route('/api/public/apply/<public_token>', methods=['POST'])
def public_apply(public_token):
    workspace = database.get_workspace_by_token(public_token)
    if not workspace:
        return jsonify({"error": "Invalid or expired application link."}), 404
        
    workspace_id = workspace['id']
    job_description = workspace['description']
    
    if 'resume' not in request.files:
        return jsonify({"error": "No resume uploaded"}), 400
        
    file = request.files['resume']
    candidate_name = request.form.get('name', '')
    candidate_email = request.form.get('email', '')
    candidate_phone = request.form.get('phone', '')
    
    # We can process this inline for simplicity, or in a background thread.
    # Given Gemini API speed, we will do it inline or submit to executor.
    try:
        file_bytes = file.read()
        
        # We start the processing
        res = process_single_resume(0, file_bytes, file.filename, job_description)
        
        # Apply deterministic Hard Threshold Logic
        score = int(res.get("overall_score", 0))
        min_score = workspace.get('min_score', 75)
        
        if score >= min_score:
            res["recommendation"] = "SHORTLIST"
        else:
            res["recommendation"] = "REJECT"
            
        if len(res.get("red_flags", [])) > 0:
            res["recommendation"] = "REVIEW"
            
        # Save to Supabase
        saved_res = database.save_candidate(
            workspace_id, 
            file.filename, 
            res, 
            name=candidate_name, 
            email=candidate_email, 
            phone=candidate_phone
        )
        return jsonify({"success": True, "message": "Application submitted successfully."}), 201
    except Exception as e:
        print("Application Error:", e)
        return jsonify({"error": "Failed to process application"}), 500

@app.route('/api/public/job/<public_token>', methods=['GET'])
def get_public_job(public_token):
    workspace = database.get_workspace_by_token(public_token)
    if not workspace:
        return jsonify({"error": "Invalid or expired application link."}), 404
    
    return jsonify({
        "title": workspace['title'],
        "description": workspace['description']
    }), 200

# --- Match Endpoint ---
@app.route('/api/match', methods=['POST'])
def match_resumes():
    if 'resumes' not in request.files:
        return jsonify({"error": "No resumes uploaded"}), 400
        
    job_description = request.form.get('job_description', '')
    workspace_id = request.form.get('workspace_id')
    min_score = int(request.form.get('min_score', 75))
    
    if not job_description or not workspace_id:
        return jsonify({"error": "No job description or workspace_id provided"}), 400

    files = request.files.getlist('resumes')
    results = []

    tasks_data = []
    for idx, file in enumerate(files):
        tasks_data.append((idx, file.read(), file.filename, job_description))

    # Process files concurrently
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(process_single_resume, data[0], data[1], data[2], data[3]): data for data in tasks_data}
        for future in concurrent.futures.as_completed(futures):
            try:
                res = future.result()
                
                # Apply deterministic Hard Threshold Logic!
                score = int(res.get("overall_score", 0))
                if score >= min_score:
                    res["recommendation"] = "SHORTLIST"
                else:
                    res["recommendation"] = "REJECT"
                
                # FORCE "REVIEW" if any red flags occur (New Logic)
                if len(res.get("red_flags", [])) > 0:
                    res["recommendation"] = "REVIEW"
                
                # Save each to DB
                saved_res = database.save_candidate(workspace_id, res["filename"], res)
                results.append(saved_res)
            except Exception as e:
                print("Unhandled Thread Error:", e)

    results.sort(key=lambda x: x.get("overall_score", 0) if isinstance(x.get("overall_score", 0), (int, float)) else 0, reverse=True)
    return jsonify({"candidates": results})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
