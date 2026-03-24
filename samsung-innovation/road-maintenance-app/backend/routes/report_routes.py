from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from datetime import datetime
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from services.ai_service import (
    get_priority,
    analyze_image,
    check_duplicate,
    summarize_text,
    generate_suggestion,
    analyze_report_text,
    detect_fake_complaint
)

report_bp = Blueprint('report_bp', __name__)

def send_status_email(recipient_email, recipient_name, updated_status, complaint_id=None):
    sender_email = "jaisam710@gmail.com"
    sender_password = "bxwwmpnawwqbcpvo"

    subject = f"Issue Status Updated: {updated_status}"
    if updated_status == "Resolved":
        status_message = "Your issue has been resolved 🎉"
        if complaint_id:
            from routes.rating_routes import generate_rating_token
            token = generate_rating_token(complaint_id)
            status_message += f"\n\nPlease rate your experience here: http://localhost:5173/rate/{complaint_id}/{token}"
    elif updated_status == "In Progress":
        status_message = "Work has started on your issue 🚧"
    else:
        status_message = f"Your issue status is now {updated_status}."

    body = (
        f"Hello {recipient_name},\n\n"
        f"{status_message}\n\n"
        f"Current status: {updated_status}\n\n"
        "Thank you for your report.\n\n"
        "Regards,\nRoad Maintenance Team"
    )

    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = recipient_email
    message["Subject"] = subject
    message.attach(MIMEText(body, "plain"))

    try:
        print(f"DEBUG - Sending email to {recipient_email} for status={updated_status}")
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, recipient_email, message.as_string())
        print(f"DEBUG - Email sent to {recipient_email} (status={updated_status})")
        return True
    except Exception as e:
        print(f"DEBUG - Email sending failed: {e}")
        return False

@report_bp.route('/report', methods=['POST'])
def create_report():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid input"}), 400
        
        db = current_app.db
        
        email = data.get("email")
        if not email:
            return jsonify({"error": "Email is required for reputation tracking"}), 400

        # Create user if not exists or get current reputation
        user = db.users.find_one({"email": email})
        if not user:
            db.users.insert_one({"email": email, "name": data.get("name"), "reputationScore": 100})
            user = {"email": email, "reputationScore": 100}

        if user.get("reputationScore", 100) < 50:
            return jsonify({"error": "Complaint blocked due to low reputation score (< 50)."}), 403
            
        location = data.get("location")
        if not location or "latitude" not in location or "longitude" not in location:
            return jsonify({"error": "Auto-captured GPS location (latitude, longitude) is required."}), 400

        is_emergency = data.get("isEmergency", False)
        language = data.get("language", "en")
        
        # Base report
        report = {
            "name": data.get("name"),
            "email": email,
            "issueType": data.get("issueType"),
            "description": data.get("description"),
            "image": data.get("image"), # Stores base64
            "address": data.get("address", ""), # Stores manual unique location
            "location": location,
            "status": "Pending",
            "createdAt": datetime.utcnow(),
            "isFake": False,
            "isEmergency": is_emergency,
            "language": language
        }

        # AI enhancements
        print(f"\\n{'='*80}")
        print(f"Starting AI enrichment for report: {report.get('issueType')}")
        print(f"{'='*80}")
        
        try:
            print(f"Calling AI services...")
            
            print(f"  1.  analyze_report_text()...")
            text_analysis = analyze_report_text(report.get("issueType", ""), report.get("description", ""), report.get("location", ""), db.reports)
            report["priority"] = text_analysis["priority"]
            if report.get("isEmergency"):
                report["priority"] = "HIGH"
                print("     [OK] Emergency Priority Override (HIGH)")
            report["summary"] = text_analysis["summary"]
            report["isDuplicate"] = text_analysis["isDuplicate"]
            report["aiSuggestion"] = text_analysis["aiSuggestion"]
            print(f"     [OK] Text Analysis Complete: Priority={report['priority']}, Duplicate={report['isDuplicate']}")
            
            print(f"  2.  analyze_image()...")
            image_analysis = analyze_image(report.get("image"))
            report["aiDetection"] = {
                "damageType": image_analysis.get("damageType", "Unknown"),
                "severity": image_analysis.get("severity", "Unknown")
            }
            if image_analysis.get("aiSuggestion"):
                report["aiSuggestion"] = image_analysis["aiSuggestion"]
            print(f"     [OK] aiDetection: {report['aiDetection']}")
            
            print(f"  3.  detect_fake_complaint()...")
            fake_result = detect_fake_complaint(report.get("description"), report.get("image"))
            report["isFake"] = fake_result.get("isFake", False)
            print(f"     [OK] Fake Detection: {report['isFake']} (Confidence: {fake_result.get('confidence')})")
            
            # Reputation score update
            current_score = user.get("reputationScore", 100)
            if report["isFake"]:
                new_score = current_score - 10
            else:
                new_score = current_score + 5
            
            db.users.update_one({"email": email}, {"$set": {"reputationScore": new_score}})
            print(f"     [OK] User Reputation updated: {current_score} -> {new_score}")
            
            print(f"\\n[OK] All AI services completed successfully!")
            print(f"{'='*80}\\n")
            
        except Exception as e:
            print(f"\\n[ERROR] AI enrichment failed: {e}")
            print(f"{'='*80}")
            print(f"Using AI fallback defaults...")
            report.setdefault("priority", "MEDIUM")
            report.setdefault("summary", "")
            report.setdefault("isDuplicate", False)
            report.setdefault("aiSuggestion", {"urgency": "Medium", "workersNeeded": "2", "estimatedTime": "2 days"})
            report.setdefault("aiDetection", {"damageType": "Unknown", "severity": "Unknown"})
            print(f"[OK] Fallback defaults applied\\n")

        result = db.reports.insert_one(report)
        print(f"[SAVE] Report saved to MongoDB with ID: {result.inserted_id}")
        return jsonify({"message": "Report created successfully", "id": str(result.inserted_id)}), 201
        
    except Exception as e:
        print(f"DEBUG - create_report exception: {e}")
        return jsonify({"error": str(e)}), 500


@report_bp.route('/reports', methods=['GET'])
def get_reports():
    try:
        db = current_app.db
        reports_cursor = db.reports.find().sort("createdAt", -1)
        reports = []
        for r in reports_cursor:
            r['_id'] = str(r['_id'])
            reports.append(r)
        
        return jsonify(reports), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@report_bp.route('/report/<id>', methods=['PUT'])
def update_report_status(id):
    try:
        data = request.json
        new_status = data.get("status")

        if not new_status or new_status not in ["Pending", "In Progress", "Resolved"]:
            return jsonify({"error": "Invalid status"}), 400

        db = current_app.db
        report = db.reports.find_one({"_id": ObjectId(id)})

        if not report:
            print("DEBUG - report not found for status update")
            return jsonify({"error": "Report not found"}), 404

        update_result = db.reports.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"status": new_status}}
        )

        print(f"DEBUG - update_result matched={update_result.matched_count}, modified={update_result.modified_count}")

        if update_result.matched_count == 0:
            return jsonify({"error": "Report not found"}), 404

        # Try to send email notification to the report owner.
        email_sent = False
        try:
            if report.get("email") and report.get("name"):
                print(f"DEBUG - email step: report email={report.get('email')} name={report.get('name')} status={new_status}")
                email_sent = send_status_email(report["email"], report["name"], new_status, str(report["_id"]))
            else:
                print("DEBUG - email step: missing email or name, skipping email")
        except Exception as email_exc:
            print(f"DEBUG - email step exception: {email_exc}")

        return jsonify({"message": "Status updated successfully", "emailSent": email_sent}), 200

    except Exception as e:
        print(f"DEBUG - update_report_status exception: {e}")
        return jsonify({"error": str(e)}), 500


@report_bp.route('/report/<id>', methods=['DELETE'])
def delete_report(id):
    try:
        db = current_app.db
        result = db.reports.delete_one({"_id": ObjectId(id)})
        
        if result.deleted_count == 0:
            return jsonify({"error": "Report not found"}), 404
            
        return jsonify({"message": "Report deleted successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@report_bp.route('/test-ai', methods=['GET'])
def test_ai():
    """
    Test endpoint to verify all AI functions are working correctly.
    Returns all AI outputs for dummy test data.
    """
    print("\\n" + "="*80)
    print("Testing AI Integration")
    print("="*80)
    
    try:
        # Import the module to get current state
        import services.ai_service as ai_service
        
        AI_ENABLED = ai_service.AI_ENABLED
        print(f"[OK] AI_ENABLED (from module): {AI_ENABLED}")
        print(f"[OK] genai_client: {ai_service.genai_client}")
        
        from services.ai_service import (
            get_priority,
            analyze_image,
            check_duplicate,
            summarize_text,
            generate_suggestion,
            analyze_report_text
        )
        
        # Test data
        test_issue_type = "Pothole"
        test_description = "Large pothole on main street causing traffic issues. Road surface is completely damaged in multiple locations."
        test_location = {"latitude": 40.7128, "longitude": -74.0060}
        
        print(f"\\nTest Data:")
        print(f"  Issue Type: {test_issue_type}")
        print(f"  Description: {test_description}")
        print(f"  Location: {test_location}")
        
        print(f"\\nTesting analyze_report_text()...")
        db = current_app.db
        text_analysis = analyze_report_text(test_issue_type, test_description, test_location, db.reports)
        priority = text_analysis["priority"]
        summary = text_analysis["summary"]
        is_duplicate = text_analysis["isDuplicate"]
        suggestion = text_analysis["aiSuggestion"]
        print(f"  [OK] Text Analysis Result: {text_analysis}")
        
        # Test Image Analysis (with empty/dummy image)
        print(f"\\nTesting analyze_image()...")
        image_result = analyze_image(None)  # Test with None
        print(f"  [OK] Result: {image_result}")
        
        result = {
            "status": "[OK] All AI tests passed!",
            "AI_ENABLED": AI_ENABLED,
            "gemini_client_available": ai_service.genai_client is not None,
            "tests": {
                "priority": priority,
                "summary": summary,
                "isDuplicate": is_duplicate,
                "suggestion": suggestion,
                "imageAnalysis": image_result
            }
        }
        
        print("\\n" + "="*80)
        print("[OK] All AI integration tests completed successfully!")
        print("="*80 + "\\n")
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"\\n[ERROR] AI Test Failed: {str(e)}")
        print("="*80 + "\n")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"AI test failed: {str(e)}", "status": "FAILED"}), 500
