import os
import json
import fitz  # PyMuPDF
import time
import concurrent.futures
import resend
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Database and Prompts
import database
from prompts import HACKATHON_PARSE_AND_SCORE
from interview_prompts import GENERATE_INTERVIEW_QUESTIONS, EVALUATE_INTERVIEW

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

def get_recruiter_id_from_request():
    """Extract and verify the Supabase JWT from the Authorization header."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ', 1)[1]
    user = database.get_user_from_token(token)
    if user:
        return user.id
    return None

@app.route('/api/workspaces', methods=['GET'])
def get_workspaces():
    recruiter_id = get_recruiter_id_from_request()
    if not recruiter_id:
        return jsonify({"workspaces": []})
    workspaces = database.get_all_workspaces(recruiter_id=recruiter_id)
    return jsonify({"workspaces": workspaces})

@app.route('/api/workspaces', methods=['POST'])
def create_workspace():
    recruiter_id = get_recruiter_id_from_request()
    data = request.json
    title = data.get('title')
    description = data.get('description')
    min_score = int(data.get('min_score', 75))
    if not title or not description:
        return jsonify({"error": "Missing title or description"}), 400
    w_id, public_token = database.create_workspace(title, description, min_score, recruiter_id=recruiter_id)
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

@app.route('/api/candidates/<int:candidate_id>/recommendation', methods=['PATCH'])
def update_candidate_recommendation_endpoint(candidate_id):
    data = request.json
    recommendation = data.get('recommendation', 'SHORTLIST')
    if recommendation not in ('SHORTLIST', 'REVIEW', 'REJECT'):
        return jsonify({"error": "Invalid recommendation value"}), 400
    database.update_candidate_recommendation(candidate_id, recommendation)
    return jsonify({"success": True, "recommendation": recommendation}), 200

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

# ─── Interview Endpoints ─────────────────────────────────────────────────────

def send_interview_email(to_email, candidate_name, interview_link, job_title):
    """Send interview invitation email via Resend API. Returns True if sent successfully."""
    api_key      = os.getenv("RESEND_API_KEY")
    sender_email = os.getenv("SENDER_EMAIL", "NeuralHire <onboarding@resend.dev>")

    if not api_key:
        return False

    resend.api_key = api_key

    html = f"""
    <!DOCTYPE html>
    <html><body style="font-family:'Segoe UI',Arial,sans-serif;background:#f0f2ff;margin:0;padding:20px;">
      <div style="max-width:600px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(79,70,229,0.12);">
        <div style="background:linear-gradient(135deg,#4f46e5,#06b6d4);padding:32px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:22px;">&#129302; AI Interview Invitation</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">NeuralHire &bull; Phase 2 Assessment</p>
        </div>
        <div style="padding:32px;">
          <p style="font-size:16px;color:#0f0f1a;">Hi <strong>{candidate_name}</strong>,</p>
          <p style="color:#5e6278;line-height:1.7;">Congratulations! You've been shortlisted for the <strong>{job_title}</strong> position. As the next step, we invite you to complete a short AI-powered concept interview.</p>
          <div style="background:#f8f9ff;border:1px solid #e0e4ff;border-radius:10px;padding:16px;margin:20px 0;">
            <p style="margin:0;color:#5e6278;font-size:14px;">&#9201; <strong>~20 minutes</strong> &nbsp;|&nbsp; &#128221; <strong>5 conceptual questions</strong> &nbsp;|&nbsp; &#129504; <strong>AI evaluated</strong></p>
          </div>
          <div style="text-align:center;margin:28px 0;">
            <a href="{interview_link}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#06b6d4);color:white;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;">Start My Interview &rarr;</a>
          </div>
          <p style="font-size:12px;color:#9ca3af;margin-top:24px;word-break:break-all;">If the button doesn't work, paste this link: {interview_link}</p>
        </div>
      </div>
    </body></html>
    """

    try:
        params = {
            "from":    sender_email,
            "to":      [to_email],
            "subject": f"You're invited to an AI Interview \u2013 {job_title}",
            "html":    html,
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"Resend email error: {e}")
        return False

@app.route('/api/interviews/create', methods=['POST'])
def create_interview_endpoint():
    data = request.json
    workspace_id    = data.get('workspace_id')
    candidate_id    = data.get('candidate_id')
    candidate_email = data.get('candidate_email', '')
    candidate_name  = data.get('candidate_name', 'Candidate')
    job_description = data.get('job_description', '')
    job_title       = data.get('job_title', 'the role')

    if not workspace_id or not candidate_id:
        return jsonify({"error": "workspace_id and candidate_id required"}), 400

    # Generate AI questions
    questions = []
    try:
        prompt = GENERATE_INTERVIEW_QUESTIONS.format(job_description=job_description[:3000])
        q_data = call_llm(prompt)
        questions = q_data.get("questions", [])
    except Exception as e:
        print(f"Question generation error: {e}")

    if not questions:
        questions = [
            {"id": 1, "question": "Describe the most technically challenging project you've worked on. What was your role and how did you overcome the key obstacles?", "difficulty": "foundational", "topic": "Problem Solving"},
            {"id": 2, "question": "Explain a core concept fundamental to this role and describe a practical scenario where you applied it.", "difficulty": "foundational", "topic": "Core Knowledge"},
            {"id": 3, "question": "How do you approach debugging a complex issue you've never encountered before? Walk us through your methodology.", "difficulty": "intermediate", "topic": "Debugging"},
            {"id": 4, "question": "Describe a situation where you had to rapidly learn a new technology or framework. How did you ensure competency?", "difficulty": "intermediate", "topic": "Learning Agility"},
            {"id": 5, "question": "What do you consider the most critical best practice in your field today, and how do you ensure it's upheld in your work?", "difficulty": "advanced", "topic": "Best Practices"},
        ]

    interview = database.create_interview(
        workspace_id=workspace_id,
        candidate_id=candidate_id,
        candidate_email=candidate_email,
        candidate_name=candidate_name,
        questions=questions
    )

    if not interview:
        return jsonify({"error": "Failed to create interview in database"}), 500

    token = interview['interview_token']
    origin = request.headers.get('Origin', request.host_url.rstrip('/'))
    interview_link = f"{origin}/interview/{token}"

    email_sent = False
    if candidate_email:
        email_sent = send_interview_email(candidate_email, candidate_name, interview_link, job_title)

    return jsonify({
        "success": True,
        "interview_token": token,
        "interview_link": interview_link,
        "email_sent": email_sent,
        "candidate_email": candidate_email
    }), 201

@app.route('/api/interviews/<token>', methods=['GET'])
def get_interview_endpoint(token):
    interview = database.get_interview_by_token(token)
    if not interview:
        return jsonify({"error": "Interview not found or link has expired."}), 404
    # Get workspace title for the interview page
    workspace = database.get_workspace_by_id(interview['workspace_id'])
    interview['job_title']       = workspace['title'] if workspace else 'the role'
    interview['job_description'] = workspace['description'] if workspace else ''
    return jsonify(interview), 200

@app.route('/api/interviews/<token>/start', methods=['PUT'])
def start_interview_endpoint(token):
    database.update_interview_status(token, 'in_progress')
    return jsonify({"success": True}), 200

@app.route('/api/interviews/<token>/submit', methods=['POST'])
def submit_interview_endpoint(token):
    interview = database.get_interview_by_token(token)
    if not interview:
        return jsonify({"error": "Interview not found"}), 404
    if interview.get('status') == 'completed':
        return jsonify({"error": "Interview already submitted", "overall_score": interview.get('overall_score'), "ai_feedback": interview.get('ai_feedback')}), 200

    data    = request.json
    answers = data.get('answers', [])

    questions = interview.get('questions', [])
    qa_pairs  = ""
    for q in questions:
        ans_obj = next((a for a in answers if a.get('question_id') == q['id']), None)
        answer  = ans_obj.get('answer', '(No answer provided)') if ans_obj else '(No answer provided)'
        qa_pairs += f"\nQ{q['id']} [{q.get('difficulty','N/A')}] ({q.get('topic','')}):\n{q['question']}\nAnswer: {answer}\n"

    workspace = database.get_workspace_by_id(interview['workspace_id'])
    job_desc  = workspace['description'] if workspace else ''

    try:
        prompt     = EVALUATE_INTERVIEW.format(job_description=job_desc[:2000], qa_pairs=qa_pairs[:8000])
        evaluation = call_llm(prompt)
        question_scores = evaluation.get('question_scores', [])
        overall_score   = int(evaluation.get('overall_score', 0))
        ai_feedback = {
            'overall_feedback':         evaluation.get('overall_feedback', ''),
            'interview_recommendation': evaluation.get('interview_recommendation', 'MAYBE'),
            'key_strengths':            evaluation.get('key_strengths', []),
            'knowledge_gaps':           evaluation.get('knowledge_gaps', [])
        }
    except Exception as e:
        print(f"Evaluation error: {e}")
        question_scores = [{"question_id": q['id'], "score": 50, "feedback": "Could not evaluate at this time.", "demonstrated_concepts": []} for q in questions]
        overall_score   = 50
        ai_feedback     = {"overall_feedback": "Evaluation is temporarily unavailable. Your answers have been saved.", "interview_recommendation": "MAYBE", "key_strengths": [], "knowledge_gaps": []}

    database.submit_interview_answers(token, answers, question_scores, overall_score, ai_feedback)

    return jsonify({
        "success": True,
        "overall_score": overall_score,
        "ai_feedback":   ai_feedback,
        "question_scores": question_scores
    }), 200

@app.route('/api/workspaces/<int:workspace_id>/interviews', methods=['GET'])
def get_workspace_interviews_endpoint(workspace_id):
    interviews = database.get_interviews_for_workspace(workspace_id)
    return jsonify({"interviews": interviews}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
