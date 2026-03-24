import os
from pathlib import Path
from dotenv import load_dotenv

# Load env
dotenv_path = Path('c:/Dev/Projects/Citizen_feedback project/samsung-innovation/road-maintenance-app/backend/.env')
load_dotenv(dotenv_path)

import sys
sys.path.append('c:/Dev/Projects/Citizen_feedback project/samsung-innovation/road-maintenance-app/backend')

from services.ai_service import _genai_generate_text

test_description = "Large pothole on main street causing traffic issues. Road surface is completely damaged in multiple locations."
test_location = {"latitude": 40.7128, "longitude": -74.0060}
test_issue_type = "Pothole"

prompt = f"""
Analyze this new road maintenance report and return a JSON object with 4 fields:
1. "priority": "HIGH", "MEDIUM", or "LOW" based on severity.
2. "summary": One concise sentence summarizing the problem and location.
3. "isDuplicate": true or false (Is this almost exactly the same real-world issue as ANY of the existing reports?)
4. "aiSuggestion": An object with "urgency" (High/Medium/Low), "workersNeeded" (number 1-5), and "estimatedTime" (e.g. "2 days").

New report:
Issue: {test_issue_type}
Description: {test_description}
Location: {test_location}

Existing reports to check for duplicates:
None

Respond STRICTLY with valid JSON only, exactly matching the format below.
{{
  "priority": "HIGH",
  "summary": "Large pothole requiring immediate fix on Main St",
  "isDuplicate": false,
  "aiSuggestion": {{
    "urgency": "High",
    "workersNeeded": "2",
    "estimatedTime": "1 day"
  }}
}}
"""

print("Sending Prompt...")
res = _genai_generate_text(prompt)
print("--- RAW GEMINI RESP ---")
print(res)
print("-----------------------")
