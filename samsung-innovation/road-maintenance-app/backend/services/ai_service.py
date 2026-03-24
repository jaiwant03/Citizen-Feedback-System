import os
import re
import json
import logging
from pathlib import Path

# Load environment variables from .env file in backend directory
dotenv_path = Path(__file__).parent.parent / '.env'
from dotenv import load_dotenv
load_dotenv(dotenv_path)

# Configure logging - suppress MongoDB driver logs
logging.getLogger('pymongo').setLevel(logging.WARNING)
logging.getLogger('urllib3').setLevel(logging.WARNING)

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s [AI-SERVICE] %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

logger.info(f"Loading .env from: {dotenv_path}")
logger.info(f".env file exists: {dotenv_path.exists()}")

try:
    import google.genai as genai
    logger.info("[OK] Successfully imported google.genai library")
except ImportError:
    logger.error("[ERROR] google-genai library is NOT installed. Install it with: pip install google-genai")
    genai = None

# Initialize the Gemini client from environment variable
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
AI_ENABLED = False
genai_client = None

# Log API key status (masked for security)
api_key_masked = f"{GEMINI_API_KEY[:5]}...{GEMINI_API_KEY[-4:]}" if GEMINI_API_KEY else "NOT SET"
logger.info(f"GEMINI_API_KEY environment variable: {api_key_masked}")

def _initialize_gemini():
    """Initialize Gemini AI client"""
    global AI_ENABLED, genai_client
    
    logger.info(f"genai module available: {genai is not None}")
    logger.info(f"GEMINI_API_KEY available: {bool(GEMINI_API_KEY)}")
    
    if genai is None:
        logger.error('[ERROR] CRITICAL ERROR: google-genai library is not installed. Install with: pip install google-genai')
        AI_ENABLED = False
        return
    elif not GEMINI_API_KEY:
        logger.error('[ERROR] CRITICAL ERROR: GEMINI_API_KEY is not set in .env file!')
        AI_ENABLED = False
        return
    
    try:
        logger.info("[LOADING] Attempting to initialize Gemini AI client...")
        
        # New google.genai API (1.x)
        genai_client = genai.Client(api_key=GEMINI_API_KEY)
        AI_ENABLED = True
        logger.info('[OK][OK][OK] Gemini API initialized successfully with Client API')
        
    except Exception as e:
        logger.error(f'[ERROR] CRITICAL ERROR: Failed to initialize Gemini client: {e}')
        import traceback
        logger.error(f'Traceback: {traceback.format_exc()}')
        AI_ENABLED = False

# Initialize on module load
logger.info("Calling _initialize_gemini()...")
_initialize_gemini()
logger.info(f"After _initialize_gemini(): AI_ENABLED={AI_ENABLED}")

# Model names may need adjustment based on your Gemini account
TEXT_MODEL = os.getenv('GEMINI_TEXT_MODEL', 'gemini-2.5-flash')
VISION_MODEL = os.getenv('GEMINI_VISION_MODEL', 'gemini-2.5-flash')

logger.info(f"TEXT_MODEL: {TEXT_MODEL}")
logger.info(f"VISION_MODEL: {VISION_MODEL}")


def _normalize_bool_answer(text):
    if not text:
        return False
    t = text.strip().lower()
    if 'yes' in t or 'true' in t or 'duplicate' in t:
        return True
    return False


def _genai_generate_text(prompt):
    if not AI_ENABLED or not genai_client:
        logger.warning("AI not enabled, returning empty string")
        return ''

    try:
        import time
        max_retries = 3
        for attempt in range(max_retries):
            try:
                logger.debug(f"Calling Gemini API with model: {TEXT_MODEL}")
                # New google.genai API (1.x) with Client
                response = genai_client.models.generate_content(
                    model=TEXT_MODEL,
                    contents=prompt
                )
                text = response.text if hasattr(response, 'text') else str(response)
                logger.debug(f"Gemini response (first 100 chars): {text[:100]}")
                return text

            except Exception as e:
                err_str = str(e)
                if '429' in err_str and attempt < max_retries - 1:
                    logger.warning(f"[WARNING] 429 Rate Limit hit in text gen. Waiting 20s... (Attempt {attempt+1}/{max_retries})")
                    time.sleep(20)
                    continue
                    
                logger.error(f'[ERROR] Gemini text generation failed: {err_str}')
                import traceback
                logger.error(f'Traceback: {traceback.format_exc()}')
                return ''

        return ''
    except Exception as e:
        logger.error(f"[ERROR] Unhandled Gemini text generation exception: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return ''


def get_priority(issue_type, description, location):
    logger.info(f"Running priority classification for issue: {issue_type}")
    if not AI_ENABLED:
        logger.warning("AI disabled, returning default priority MEDIUM")
        return 'MEDIUM'

    try:
        prompt = f"""
Classify priority of this road issue:
Issue: {issue_type}
Description: {description}
Location: {location}

Return only HIGH, MEDIUM or LOW.
"""
        text = _genai_generate_text(prompt).strip().upper()
        match = re.search(r'\b(HIGH|MEDIUM|LOW)\b', text)
        result = match.group(1) if match else 'MEDIUM'
        logger.info(f"Priority classification result: {result}")
        return result
    except Exception as e:
        logger.error(f"Priority classification failed: {e}")
        return 'MEDIUM'


def summarize_text(description):
    logger.info(f"Running text summarization (description length: {len(description) if description else 0})")
    if not description:
        logger.debug("Empty description provided")
        return ''
    if not AI_ENABLED:
        logger.warning("AI disabled, returning truncated description")
        return description[:350]
    try:
        prompt = f"""Summarize this road maintenance issue description in one concise sentence that captures the key problem and location details:

Description: {description}

Summary:"""
        text = _genai_generate_text(prompt).strip()
        result = text[:350] if text else description[:350]
        logger.info(f"Summary result (length: {len(result)}): {result[:100]}")
        return result
    except Exception as e:
        logger.error(f"Text summarization failed: {e}")
        return description[:350]


def check_duplicate(issue_type, description, location, reports_collection):
    logger.info(f"Checking for duplicates: issue_type={issue_type}")
    if not AI_ENABLED:
        logger.warning("AI disabled, using simple duplicate check")
        query = {
            'issueType': issue_type,
            'location': location,
        }
        existing = reports_collection.find_one(query)
        result = existing is not None
        logger.info(f"Simple duplicate check result: {result}")
        return result

    try:
        candidates = list(reports_collection.find({}, {'issueType': 1, 'description': 1, 'location': 1}).sort('createdAt', -1).limit(10))
        logger.debug(f"Found {len(candidates)} candidates to check")
        
        if not candidates:
            logger.info("No candidates found, not a duplicate")
            return False

        new_item = f"Issue: {issue_type}\nDescription: {description}\nLocation: {location}"

        existing_reports_text = ""
        for idx, candidate in enumerate(candidates):
            # Check for exact matches first to ensure duplicate is caught
            if description and candidate.get('description', '') == description and candidate.get('issueType', '') == issue_type:
                logger.info("[OK] Exact match duplicate detected!")
                return True

            existing_item = f"Issue: {candidate.get('issueType', '')}\nDescription: {candidate.get('description', '')}\nLocation: {candidate.get('location', '')}"
            existing_reports_text += f"Report {idx+1}:\n{existing_item}\n\n"

        prompt = f"""
Determine if this new road maintenance report is a duplicate (same real-world issue) of ANY of the following existing reports.

New report:
{new_item}

Existing reports:
{existing_reports_text}

Answer only yes or no.
"""
        answer = _genai_generate_text(prompt).strip().lower()
        logger.debug(f"Duplicate check bulk result: {answer}")
        
        if _normalize_bool_answer(answer):
            logger.info("[OK] Duplicate detected from bulk check!")
            return True

        logger.info("[OK] Not a duplicate")
        return False
    except Exception as e:
        logger.error(f"Duplicate check failed: {e}, falling back to simple check")
        # Fallback to simple local check for the same issue type/location and similar description
        query = {
            'issueType': issue_type,
            'location': location,
        }
        existing = reports_collection.find_one(query)
        result = existing is not None
        logger.info(f"Fallback duplicate check result: {result}")
        return result


def analyze_image(image_base64):
    logger.info("Analyzing road damage image")
    # Keep a default structure to store in DB always
    ai_detection = {'damageType': 'Unknown', 'severity': 'Unknown'}
    
    if not image_base64:
        logger.warning("No image provided, returning default detection")
        return ai_detection

    if not AI_ENABLED or not genai_client:
        logger.warning("AI disabled or not available, returning default detection")
        return ai_detection

    try:
        # New google.genai API with Client and vision support
        import base64
        from io import BytesIO

        logger.debug(f"Image size: {len(image_base64)} bytes")
        
        mime_type = 'image/jpeg'
        if image_base64.startswith('data:'):
            try:
                mime_type = image_base64.split(';')[0].split(':')[1]
            except Exception:
                pass
                
        # Extract actual base64 data if it contains data URI scheme
        if ',' in image_base64:
            image_base64 = image_base64.split(',', 1)[1]

        # Prepare image content
        text = ''

        # Use new Client API for image analysis
        logger.debug("Using Client API for image analysis")
        prompt_with_image = """Analyze this road damage image and return ONLY a JSON object with exactly three keys: damageType, severity, and aiSuggestion.
Example: {"damageType": "pothole", "severity": "HIGH", "aiSuggestion": {"urgency": "High", "workersNeeded": "2", "estimatedTime": "1 day"}}

Choose damageType from: pothole, crack, damage, or other.
Choose severity from: HIGH, MEDIUM, LOW.
For aiSuggestion, analyze the visible damage and provide realistic estimates.

Be specific and concise."""
        
        import time
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = genai_client.models.generate_content(
                    model=VISION_MODEL,
                    contents=[
                        prompt_with_image,
                        genai.types.Part.from_bytes(
                            data=base64.b64decode(image_base64),
                            mime_type=mime_type
                        )
                    ]
                )
                text = response.text if hasattr(response, 'text') else str(response)
                logger.debug(f"Vision API response: {text[:150]}")

                # Try to parse JSON from the response
                json_match = re.search(r"\{[\s\S]*\}", text)
                if json_match:
                    try:
                        data = json.loads(json_match.group(0))
                        # Normalize values
                        dt = str(data.get('damageType', 'unknown')).lower()
                        sev = str(data.get('severity', 'UNKNOWN')).upper()
                        
                        # Check valid types
                        if any(x in dt for x in ['pothole', 'crack', 'damage']):
                            for valid_type in ['pothole', 'crack', 'damage']:
                                if valid_type in dt:
                                    ai_detection['damageType'] = valid_type
                                    break
                        else:
                            ai_detection['damageType'] = 'other' if dt != 'unknown' else 'unknown'
                            
                        ai_detection['severity'] = sev if sev in ['HIGH', 'MEDIUM', 'LOW'] else 'UNKNOWN'
                        
                        if 'aiSuggestion' in data:
                            ai_detection['aiSuggestion'] = data['aiSuggestion']
                        
                        logger.info(f"Image analysis JSON result: {ai_detection}")
                        return ai_detection
                    except Exception as e:
                        logger.warning(f"Failed to parse image JSON: {e}, falling back to text search")

                lower = text.lower() if text else ''
                if 'pothole' in lower:
                    ai_detection['damageType'] = 'pothole'
                elif 'crack' in lower:
                    ai_detection['damageType'] = 'crack'
                elif 'damage' in lower:
                    ai_detection['damageType'] = 'damage'
                else:
                    ai_detection['damageType'] = 'unknown'

                if 'severe' in lower or 'high' in lower:
                    ai_detection['severity'] = 'HIGH'
                elif 'medium' in lower:
                    ai_detection['severity'] = 'MEDIUM'
                elif 'low' in lower or 'minor' in lower:
                    ai_detection['severity'] = 'LOW'
                else:
                    ai_detection['severity'] = 'UNKNOWN'

                logger.info(f"Image analysis string result: {ai_detection}")
                return ai_detection
                
            except Exception as e:
                err_str = str(e)
                if '429' in err_str and attempt < max_retries - 1:
                    logger.warning(f"[WARNING] 429 Rate Limit hit in image gen. Waiting 20s... (Attempt {attempt+1}/{max_retries})")
                    time.sleep(20)
                    continue
                logger.error(f'[ERROR] Image analysis failed: {err_str}')
                return ai_detection
                
        return ai_detection
    except Exception as e:
        logger.error(f'[ERROR] Unhandled image analysis exception: {e}')
        import traceback
        logger.error(f'Traceback: {traceback.format_exc()}')
        return ai_detection


def generate_suggestion(issue_type, description, location):
    logger.info(f"Generating AI suggestion for: {issue_type}")
    default_suggestion = {
        'urgency': 'Medium',
        'workersNeeded': '2',
        'estimatedTime': '2 days'
    }
    
    if not AI_ENABLED:
        logger.warning("AI disabled, returning default suggestion")
        return default_suggestion
    
    try:
        prompt = f"""Based on this road maintenance issue, provide realistic repair suggestions:

Issue Type: {issue_type}
Description: {description}
Location: {location}

Provide a JSON response with:
- urgency: HIGH/MEDIUM/LOW based on safety impact and traffic disruption
- workersNeeded: realistic number of workers (1-5) based on issue complexity
- estimatedTime: realistic time estimate (hours/days) based on typical repair times

Consider:
- Potholes: usually 1-2 workers, 1-4 hours
- Cracks: 2-3 workers, 1-2 days
- Major damage: 3-5 workers, 2-7 days
- Safety hazards get higher urgency

Return only valid JSON:
{{"urgency": "...", "workersNeeded": "...", "estimatedTime": "..."}}
"""
        text = _genai_generate_text(prompt).strip()
        logger.debug(f"AI suggestion response: {text[:200]}")

        # Very lenient JSON parse heuristics
        json_match = re.search(r"\{.*\}", text, re.DOTALL)
        if json_match:
            try:
                data = json.loads(json_match.group(0))
                result = {
                    'urgency': data.get('urgency', 'Medium'),
                    'workersNeeded': data.get('workersNeeded', '2'),
                    'estimatedTime': data.get('estimatedTime', '2 days')
                }
                logger.info(f"[OK] AI suggestion parsed: {result}")
                return result
            except Exception as e:
                logger.warning(f"JSON parsing failed: {e}, falling back to heuristics")

        # fallback from plain text
        urgency = 'Medium'
        if 'high' in text.lower():
            urgency = 'High'
        elif 'low' in text.lower():
            urgency = 'Low'

        workers_needed = '2'
        estimated_time = '2 days'
        numbers = re.findall(r"(\d+)\s*(?:workers|people|men|crew|staff)", text.lower())
        if numbers:
            workers_needed = numbers[0]

        duration = re.search(r"(\d+\s*(?:hours|days|weeks))", text.lower())
        if duration:
            estimated_time = duration.group(1)

        result = {
            'urgency': urgency,
            'workersNeeded': workers_needed,
            'estimatedTime': estimated_time
        }
        logger.info(f"[OK] AI suggestion (heuristic): {result}")
        return result
    except Exception as e:
        logger.error(f"Suggestion generation failed: {e}, returning defaults")
        return default_suggestion

def analyze_report_text(issue_type, description, location, reports_collection):
    logger.info(f"Running combined AI text analysis for: {issue_type}")
    
    # Defaults
    result = {
        'priority': 'MEDIUM',
        'summary': description[:350] if description else '',
        'isDuplicate': False,
        'aiSuggestion': {
            'urgency': 'Medium',
            'workersNeeded': '2',
            'estimatedTime': '2 days'
        }
    }
    
    if not AI_ENABLED or not description:
        logger.warning("AI disabled or missing description, using defaults and simple duplicate check")
        query = {'issueType': issue_type, 'location': location}
        existing = reports_collection.find_one(query)
        if existing:
            result['isDuplicate'] = True
        return result

    try:
        candidates = list(reports_collection.find({}, {'issueType': 1, 'description': 1, 'location': 1}).sort('createdAt', -1).limit(10))
        
        is_exact_dup = False
        existing_reports_text = ""
        for idx, candidate in enumerate(candidates):
            if candidate.get('description', '') == description and candidate.get('issueType', '') == issue_type:
                logger.info("[OK] Exact match duplicate detected locally!")
                is_exact_dup = True
            
            existing_item = f"Issue: {candidate.get('issueType', '')}\nDescription: {candidate.get('description', '')}\nLocation: {candidate.get('location', '')}"
            existing_reports_text += f"Report {idx+1}:\n{existing_item}\n\n"

        prompt = f"""
Analyze this new road maintenance report and return a JSON object with 4 fields:
1. "priority": "HIGH", "MEDIUM", or "LOW" based on severity.
2. "summary": A very brief 3-to-10 word title summarizing the core issue (Do NOT just copy the description).
3. "isDuplicate": true or false (Is this almost exactly the same real-world issue as ANY of the existing reports?)
4. "aiSuggestion": An object with "urgency" (High/Medium/Low), "workersNeeded" (number 1-5), and "estimatedTime" (e.g. "2 days").

New report:
Issue: {issue_type}
Description: {description}
Location: {location}

Existing reports to check for duplicates:
{existing_reports_text if existing_reports_text else "None"}

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
        text = _genai_generate_text(prompt).strip()
        
        if not text:
            return result
            
        # Strip code formatting if present
        if "```json" in text:
            text = text.split("```json")[-1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1]
            
        text = text.strip()
        
        # Extra extraction to handle plain text mixed with json 
        json_match = re.search(r"\{[\s\S]*\}", text)
        if json_match:
            text = json_match.group(0)

        try:
            parsed = json.loads(text)
            
            p = str(parsed.get('priority', 'MEDIUM')).upper()
            result['priority'] = p if p in ['HIGH', 'MEDIUM', 'LOW'] else 'MEDIUM'
            
            s = str(parsed.get('summary', ''))
            if s and len(s) > 10:
                result['summary'] = s[:350]
                
            dup = parsed.get('isDuplicate', False)
            result['isDuplicate'] = is_exact_dup or bool(dup)
            
            sug = parsed.get('aiSuggestion', {})
            if isinstance(sug, dict) and sug:
                result['aiSuggestion']['urgency'] = str(sug.get('urgency', 'Medium'))
                result['aiSuggestion']['workersNeeded'] = str(sug.get('workersNeeded', '2'))
                result['aiSuggestion']['estimatedTime'] = str(sug.get('estimatedTime', '2 days'))
                
            logger.info(f"[OK] Combined text analysis successful")
            return result
        except json.JSONDecodeError as je:
            logger.warning(f"Failed to parse JSON from combined prompt: {{je}}.\\nText was: {{text[:100]}}\\nFalling back to defaults.")
            result['isDuplicate'] = is_exact_dup
            return result
            
    except Exception as e:
        logger.error(f"Combined text analysis failed: {e}")
        query = {'issueType': issue_type, 'location': location}
        existing = reports_collection.find_one(query)
        result['isDuplicate'] = existing is not None
        return result

def detect_fake_complaint(description, image_base64=None):
    logger.info("Running AI fake complaint detection")
    result = {'isFake': False, 'confidence': 1.0}
    
    if not AI_ENABLED or not genai_client:
        logger.warning("AI disabled or not available, returning default detection (not fake)")
        return result

    try:
        import json
        import re
        
        prompt = f"""
Analyze this road maintenance report description to determine if it is a fake, spam, completely unrealistic, or irrelevant complaint. 
The description is: '{description}'.

Respond STRICTLY with valid JSON only, exactly matching the format below.
{{
  "isFake": true or false,
  "confidence": a number between 0.0 and 1.0 indicating how confident you are
}}
"""
        
        # Note: If we had a vision model call we would do it here, but to avoid high latency 
        # for a simple text check we use the TEXT_MODEL. 
        # The prompt instructed us to use Gemini to detect spam/unrealistic reports.
        text = _genai_generate_text(prompt).strip()
        
        if not text:
            return result
            
        if "```json" in text:
            text = text.split("```json")[-1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1]
            
        text = text.strip()
        
        json_match = re.search(r"\{[\s\S]*\}", text)
        if json_match:
            text = json_match.group(0)

        try:
            parsed = json.loads(text)
            result['isFake'] = bool(parsed.get('isFake', False))
            result['confidence'] = float(parsed.get('confidence', 1.0))
            logger.info(f"[OK] Fake detection successful: {result}")
            return result
        except Exception as je:
            logger.warning(f"Failed to parse JSON for fake detection: {je}. Text was: {text[:100]}. Returning default.")
            return result

    except Exception as e:
        logger.error(f"AI fake detection failed: {e}")
        return result

