from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from datetime import datetime
import jwt
import os

rating_bp = Blueprint('rating_bp', __name__)

def generate_rating_token(complaint_id):
    secret = os.environ.get("JWT_SECRET", "my_super_secret_key_123")
    return jwt.encode({"complaint_id": str(complaint_id)}, secret, algorithm="HS256")

@rating_bp.route('/rate', methods=['POST'])
def submit_rating():
    try:
        data = request.json
        complaint_id = data.get("complaintId")
        token = data.get("token")
        rating = data.get("rating")
        
        if not complaint_id or not token or not rating:
            return jsonify({"error": "Missing required fields"}), 400
            
        if not str(rating).isdigit() or not (1 <= int(rating) <= 5):
            return jsonify({"error": "Rating must be a number from 1 to 5"}), 400
            
        # Validate token
        try:
            secret = os.environ.get("JWT_SECRET", "my_super_secret_key_123")
            decoded = jwt.decode(token, secret, algorithms=["HS256"])
            if decoded.get("complaint_id") != str(complaint_id):
                return jsonify({"error": "Invalid token for this complaint"}), 403
        except Exception as e:
            return jsonify({"error": "Token validation failed: " + str(e)}), 403
            
        db = current_app.db
        
        report = db.reports.find_one({"_id": ObjectId(complaint_id)})
        if not report:
            return jsonify({"error": "Complaint not found"}), 404
            
        if report.get("rating"):
            return jsonify({"error": "Rating already submitted for this complaint"}), 400
            
        db.reports.update_one(
            {"_id": ObjectId(complaint_id)},
            {"$set": {
                "rating": int(rating),
                "ratedAt": datetime.utcnow()
            }}
        )
        
        return jsonify({"message": "Rating submitted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
