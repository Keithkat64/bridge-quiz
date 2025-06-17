from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/')
def index():
    return jsonify({"status": "ok", "message": "Bridge Quiz API is running"})

# Import and register API routes
from api.routes import quiz_bp
app.register_blueprint(quiz_bp, url_prefix='/api')

if __name__ == '__main__':
    app.run(debug=True)
