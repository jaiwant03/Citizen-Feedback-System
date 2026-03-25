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
                "avgResolutionTime": {"$round": ["$avgResolutionTime", 2]},
                "_id": 0
            }},
            # Sort by issueType for consistent output
            {"$sort": {"issueType": 1}}
        ]
        
        results = list(db.reports.aggregate(pipeline))
        
        # Ensure we always return a valid array
        if not results:
            # Return empty array if no resolved complaints exist
            results = []
        
        # Filter out any None or undefined values
        results = [r for r in results if r.get('issueType') and r.get('avgResolutionTime') is not None]
        
        return jsonify(results), 200

    except Exception as e:
        print(f"Analytics error: {str(e)}")
        return jsonify([]), 200
