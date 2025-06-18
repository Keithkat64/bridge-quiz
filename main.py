from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return "Hello from Flask on Railway!"

@app.route('/api/quiz/<post_id>')
def quiz(post_id):
    return jsonify({
        "status": "success",
        "post_id": post_id,
        "message": "Quiz endpoint is working"
    })

@app.route('/api/submit/<post_id>', methods=['POST'])
def submit_answer(post_id):
    return jsonify({
        "status": "received",
        "post_id": post_id
    })

@app.route('/api/leaderboard/<post_id>')
def get_leaderboard(post_id):
    return jsonify({
        "status": "success",
        "post_id": post_id,
        "leaderboard": [
            {"name": "Player 1", "score": 10},
            {"name": "Player 2", "score": 8}
        ]
    })

if __name__ == '__main__':
    # This will be used when running with python main.py
    app.run(host='0.0.0.0', port=5000)
