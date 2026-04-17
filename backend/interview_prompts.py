GENERATE_INTERVIEW_QUESTIONS = """You are an expert AI technical interviewer. Based on the job description below, generate exactly 5 conceptual interview questions that test a candidate's fundamental knowledge.

Job Description:
{job_description}

Rules:
- Questions test DEEP UNDERSTANDING, not memorization of facts
- Mix: 2 foundational, 2 intermediate, 1 advanced
- Each question must be open-ended and answerable in 3-6 sentences
- Focus on practical application of the skills listed

Respond with ONLY valid JSON:
{{
  "questions": [
    {{"id": 1, "question": "...", "difficulty": "foundational", "topic": "..."}},
    {{"id": 2, "question": "...", "difficulty": "foundational", "topic": "..."}},
    {{"id": 3, "question": "...", "difficulty": "intermediate", "topic": "..."}},
    {{"id": 4, "question": "...", "difficulty": "intermediate", "topic": "..."}},
    {{"id": 5, "question": "...", "difficulty": "advanced", "topic": "..."}}
  ]
}}"""

EVALUATE_INTERVIEW = """You are an expert technical interviewer evaluating a candidate's responses.

Job Description:
{job_description}

Questions and Answers:
{qa_pairs}

Score each answer 0-100:
- 80-100: Excellent. Deep understanding and practical knowledge.
- 60-79: Good. Solid foundational knowledge with minor gaps.
- 40-59: Average. Basic understanding, missing key concepts.
- 0-39: Poor. Significant gaps or incorrect understanding.

Respond with ONLY valid JSON:
{{
  "question_scores": [
    {{"question_id": 1, "score": 0, "feedback": "Brief specific feedback.", "demonstrated_concepts": ["concept1"]}},
    {{"question_id": 2, "score": 0, "feedback": "Brief specific feedback.", "demonstrated_concepts": ["concept1"]}},
    {{"question_id": 3, "score": 0, "feedback": "Brief specific feedback.", "demonstrated_concepts": ["concept1"]}},
    {{"question_id": 4, "score": 0, "feedback": "Brief specific feedback.", "demonstrated_concepts": ["concept1"]}},
    {{"question_id": 5, "score": 0, "feedback": "Brief specific feedback.", "demonstrated_concepts": ["concept1"]}}
  ],
  "overall_score": 0,
  "overall_feedback": "2-3 sentence summary of performance.",
  "interview_recommendation": "HIRE",
  "key_strengths": ["strength1", "strength2"],
  "knowledge_gaps": ["gap1", "gap2"]
}}

interview_recommendation must be one of: HIRE, MAYBE, NO_HIRE"""
