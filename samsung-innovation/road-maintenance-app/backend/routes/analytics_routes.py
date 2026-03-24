from flask import Blueprint, jsonify, current_app
from datetime import datetime

analytics_bp = Blueprint('analytics_bp', __name__)

@analytics_bp.route('/', methods=['GET'])
def get_analytics():
    try:
        db = current_app.db
        
        # Pipeline to calculate resolution time analytics
        pipeline = [
            # Only consider resolved reports
            {"$match": {
                "status": "Resolved", 
                "createdAt": {"$exists": True, "$type": "date"},
                "resolvedAt": {"$exists": True, "$type": "date"}
            }},
            # Calculate difference in hours
            {"$project": {
                "issueType": 1,
                "resolutionTimeMs": {
                    "$subtract": ["$resolvedAt", "$createdAt"]
                }
            }},
            {"$project": {
                "issueType": 1,
                "resolutionTimeHours": {
                    "$divide": ["$resolutionTimeMs", 1000 * 60 * 60]
                }
            }},
            # Group by issue type and average
            {"$group": {
                "_id": "$issueType",
                "avgResolutionTime": {"$avg": "$resolutionTimeHours"}
            }},
            {"$project": {
                "issueType": "$_id",
                "avgResolutionTime": 1,
                "_id": 0
            }}
        ]
        
        results = list(db.reports.aggregate(pipeline))
        
        # Also return a fallback summary if the pipeline yields None or empty
        # and we want to prevent empty frontend charts if there's no data yet.
        if not results:
            results = [
                {"issueType": "Pothole", "avgResolutionTime": 0},
                {"issueType": "Crack", "avgResolutionTime": 0},
                {"issueType": "Damage", "avgResolutionTime": 0}
            ]
            
        return jsonify(results), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
