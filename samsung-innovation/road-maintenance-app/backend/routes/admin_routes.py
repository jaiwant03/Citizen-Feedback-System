from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

admin_bp = Blueprint('admin_bp', __name__)


# ---------------- LOGIN ----------------
@admin_bp.route('/login', methods=['POST'])
def admin_login():
    data = request.json or {}
    username = data.get("username")
    password = data.get("password")
    
    print(f"DEBUG - Login Request: {username}")

    if username == "admin" and password == "admin123":
        return jsonify({
            "message": "Login successful",
            "token": "admin-token",
            "user": {"username": "admin"}
        }), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401


# ---------------- EMAIL FUNCTION ----------------
def send_status_email(recipient_email, recipient_name, updated_status):
    try:
        import os

        print("📧 EMAIL FUNCTION CALLED")
        print("TO:", recipient_email)

        sender_email = os.environ.get("EMAIL_SENDER")
        sender_password = os.environ.get("EMAIL_PASSWORD")
        smtp_host = os.environ.get("EMAIL_SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.environ.get("EMAIL_SMTP_PORT", 587))

        if not sender_email or not sender_password:
            raise ValueError("EMAIL_SENDER and EMAIL_PASSWORD must be set in environment")

        subject = f"Issue Status Updated: {updated_status}"

        if updated_status == "Resolved":
            status_message = "🎉 Your issue has been resolved!"
        elif updated_status == "In Progress":
            status_message = "🚧 Work has started on your issue."
        else:
            status_message = f"Your issue status is now {updated_status}."

        body = f"""
Hello {recipient_name},

{status_message}

Current Status: {updated_status}

Thank you for reporting the issue 🙌

- RoadFix Team
"""

        message = MIMEMultipart()
        message["From"] = sender_email
        message["To"] = recipient_email
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain"))

        print(f"🔌 Connecting to SMTP server {smtp_host}:{smtp_port}...")
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()

        print("🔐 Logging in...")
        server.login(sender_email, sender_password)

        print("📤 Sending email...")
        server.sendmail(sender_email, recipient_email, message.as_string())

        server.quit()

        print("✅ EMAIL SENT SUCCESSFULLY")
        return True

    except Exception as e:
        print("❌ EMAIL ERROR:", str(e))
        return False


# ---------------- UPDATE STATUS ----------------
@admin_bp.route('/report/<id>/status', methods=['PUT'])
def admin_update_report_status(id):
    try:
        data = request.json or {}
        new_status = data.get("status")

        print("🔥 API HIT")
        print("ID:", id)
        print("NEW STATUS:", new_status)

        if not new_status or new_status not in ["Pending", "In Progress", "Resolved"]:
            return jsonify({"error": "Invalid status"}), 400

        # ✅ MongoDB connection
        db = current_app.db
        collection = db["reports"]   # ✅ YOUR COLLECTION

        # ✅ FETCH ISSUE
        report = collection.find_one({"_id": ObjectId(id)})
        print("🔍 REPORT:", report)

        if not report:
            return jsonify({"error": "Report not found"}), 404

        # ✅ UPDATE STATUS
        collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"status": new_status}}
        )

        # ✅ GET USER DETAILS
        user_email = report.get("email")
        user_name = report.get("name")

        print("📧 EMAIL FOUND:", user_email)

        # ✅ SEND EMAIL
        email_sent = False
        if user_email and user_name:
            email_sent = send_status_email(user_email, user_name, new_status)
        else:
            print("❌ Missing email or name")

        return jsonify({
            "message": "Status updated successfully",
            "status": new_status,
            "emailSent": email_sent
        }), 200

    except Exception as e:
        print("❌ ERROR:", str(e))
        return jsonify({"error": str(e)}), 500