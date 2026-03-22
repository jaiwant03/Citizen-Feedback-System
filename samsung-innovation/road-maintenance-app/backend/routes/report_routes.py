from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from datetime import datetime
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

report_bp = Blueprint('report_bp', __name__)

def send_status_email(recipient_email, recipient_name, updated_status):
    sender_email = "jaisam710@gmail.com"
    sender_password = "bxwwmpnawwqbcpvo"

    subject = f"Issue Status Updated: {updated_status}"
    if updated_status == "Resolved":
        status_message = "Your issue has been resolved 🎉"
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
        
        # Build document
        report = {
            "name": data.get("name"),
            "email": data.get("email"),
            "issueType": data.get("issueType"),
            "description": data.get("description"),
            "image": data.get("image"), # Stores base64
            "address": data.get("address", ""), # Stores manual unique location
            "location": data.get("location"), # Expects {latitude, longitude}
            "status": "Pending",
            "createdAt": datetime.utcnow()
        }
        
        result = db.reports.insert_one(report)
        return jsonify({"message": "Report created successfully", "id": str(result.inserted_id)}), 201
        
    except Exception as e:
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
                email_sent = send_status_email(report["email"], report["name"], new_status)
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
