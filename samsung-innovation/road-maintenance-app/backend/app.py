import os
from dotenv import load_dotenv

# Load environment variables FIRST, before any other imports
load_dotenv()

from flask import Flask
from flask_cors import CORS

from config.db import init_db
from routes.report_routes import report_bp
from routes.admin_routes import admin_bp

app = Flask(__name__)
# Enable CORS for all routes and origins
CORS(app)

# Initialize Database connection
app.db = init_db()

# Register Blueprints
app.register_blueprint(report_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

@app.route('/')
def home():
    return {"message": "Road Maintenance API is running"}

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, port=port)
