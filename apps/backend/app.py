from flask import Flask, jsonify
from database.session import engine, SessionLocal
from database.models import Base
from config import SECRET_KEY
from routes import register_blueprints
from flask_cors import CORS
import os
import logging
from elasticsearch import Elasticsearch
from config import ELASTICSEARCH_URL
from database.schema_migrator import run_migration

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize database
logger.info("Initializing database")
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully")
    
    # Run migration to add missing columns
    logger.info("Running database migration...")
    migration_success = run_migration()
    if migration_success:
        logger.info("Database migration completed successfully")
    else:
        logger.warning("Database migration failed, some features may not work correctly")
except Exception as e:
    logger.error(f"Database initialization error: {str(e)}")

# Initialize Flask app
app = Flask(__name__)
app.config["SECRET_KEY"] = SECRET_KEY

# Configure CORS
frontend_origin = os.environ.get("FRONTEND_ORIGIN", "*")
CORS(app, origins=[frontend_origin], supports_credentials=True)
logger.info(f"CORS configured with origin: {frontend_origin}")

# Initialize Elasticsearch
# try:
#     es = Elasticsearch(hosts=[ELASTICSEARCH_URL], request_timeout=60)
#     # Create jobs index if it doesn't exist
#     if not es.indices.exists(index="jobs"):
#         es.indices.create(index="jobs")
#         logger.info("Elasticsearch 'jobs' index created")
#     logger.info("Elasticsearch initialized successfully")
# except Exception as e:
#     logger.warning(f"Elasticsearch initialization error: {str(e)}")

# Register blueprints
register_blueprints(app)

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint for the API."""
    try:
        # Check database connection
        session = SessionLocal()
        connection = session.connection()
        connection.close()
        session.close()

        # Check Elasticsearch connection (if needed)
        es_status = "unknown"
        # try:
        #     es = Elasticsearch(hosts=[ELASTICSEARCH_URL], request_timeout=5)
        #     es_health = es.cluster.health()
        #     es_status = es_health.get("status", "unknown")
        # except Exception:
        #     es_status = "error"

        return jsonify({
            "status": "healthy",
            "database": "connected",
            "elasticsearch": es_status
        })
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

@app.route("/api/test", methods=["GET"])
def test_api():
    """Simple test endpoint to verify the API is working."""
    return jsonify({
        "status": "success",
        "message": "API is working correctly"
    })

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
