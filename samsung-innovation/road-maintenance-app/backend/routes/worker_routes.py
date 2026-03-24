from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from middleware.auth import token_required
from datetime import datetime
from routes.report_routes import send_status_email

worker_bp = Blueprint('worker_bp', __name__)

@worker_bp.route('/tasks', methods=['GET'])
@token_required(["worker", "admin"])
def get_tasks():
    try:
        db = current_app.db
        # Get tasks that are either Pending or In Progress, or all if we want them to see history.
        # Let's show all for the worker dashboard so they can see Resolved ones too, 
        # but sort so active are top or just return all and let frontend filter.
        reports_cursor = db.reports.find().sort("createdAt", -1)
        reports = []
        for r in reports_cursor:
            r['_id'] = str(r['_id'])
            reports.append(r)
            
        return jsonify(reports), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@worker_bp.route('/update-status', methods=['POST'])
@token_required(["worker", "admin"])
def update_status():
    try:
        data = request.json
        complaint_id = data.get("complaintId")
        new_status = data.get("status")
        completion_image = data.get("completionImage")
        
        if not complaint_id or not new_status:
            return jsonify({"error": "complaintId and status required"}), 400
            
        if new_status not in ["In Progress", "Resolved"]:
            return jsonify({"error": "Invalid status"}), 400
            
        db = current_app.db
        
        report = db.reports.find_one({"_id": ObjectId(complaint_id)})
        if not report:
            return jsonify({"error": "Complaint not found"}), 404
            
        update_data = {
            "status": new_status,
            "assignedWorker": request.user.get("email"),
            "updatedBy": request.user.get("role")
        }
        
        if completion_image:
            update_data["completionImage"] = completion_image
            
        if new_status == "Resolved" and report.get("status") != "Resolved":
            update_data["resolvedAt"] = datetime.utcnow()
            
        update_result = db.reports.update_one(
            {"_id": ObjectId(complaint_id)},
            {"$set": update_data}
        )
        
        if update_result.matched_count == 0:
            return jsonify({"error": "Complaint not found"}), 404
            
        # Send Email notification
        user_email = report.get("email")
        user_name = report.get("name")
        email_sent = False
        try:
            if user_email and user_name:
                # Trigger email notification
                email_sent = send_status_email(user_email, user_name, new_status)
        except Exception as e:
            print(f"Error sending email: {e}")
            
        return jsonify({"message": "Status updated successfully", "status": new_status, "emailSent": email_sent}), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
