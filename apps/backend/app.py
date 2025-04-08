from flask import Flask
from database.session import engine
from database.models import Base
from config import SECRET_KEY
from routes import register_blueprints
from flask_cors import CORS
import os

Base.metadata.create_all(bind=engine)
app = Flask(__name__)

frontend_origin = os.environ.get("FRONTEND_ORIGIN", "*")
CORS(app, origins=[frontend_origin])
app.config["SECRET_KEY"] = SECRET_KEY

register_blueprints(app)

if __name__ == "__main__":
    # app.run(debug=True, host="0.0.0.0", port=5000)
    app.run()
