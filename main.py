from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)

# Configure CORS to allow requests from your domain
CORS(app, resources={r"/api/*": {"origins": ["https://www.kattery.net", "http://www.kattery.net"]}})

@app.route('/')
def index():
    return "Hello from Flask on Railway!"

@app.route('/api/quiz/<post_id>')
def quiz(post_id):
    # For now, return a simple test response
    return jsonify({
        "status": "success",
        "post_id": post_id,
        "hands": [
            {
                "number": 1,
                "cards": {
                    "north": "AJT84 KT53 94 AJ",
                    "east": "76 762 K63 KQ963",
                    "south": "9532 4 AQJ5 T842",
                    "west": "KQ AQJ98 T872 75"
                },
                "dealer": "North",
                "bidding": [
                    "North: 1♠",
                    "East: 2♥",
                    "South: ?"
                ],
                "question": {
                    "text": "Does South bid a) 2S or b) 3S",
                    "options": ["2S", "3S"]
                },
                "solution": {
                    "text": "South bids b) 3S. ADD in your shortage points when you hold 4 card support for partner's 5 card suit.",
                    "correct_answer": "b)"
                }
            }
            # You can add more hands here later
        ]
    })

@app.route('/api/submit/<post_id>', methods=['POST'])
def submit_answer(post_id):
    data = request.json or {}
    return jsonify({
        "status": "received",
        "post_id": post_id,
        "data": data,
        "correct": True,
        "message": "Your answer is correct!"
    })

@app.route('/api/leaderboard/<post_id>')
def get_leaderboard(post_id):
    return jsonify({
        "status": "success",
        "post_id": post_id,
        "leaderboard": [
            {"name": "Player 1", "score": 10, "time": 120},
            {"name": "Player 2", "score": 8, "time": 150},
            {"name": "Player 3", "score": 7, "time": 180}
        ]
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
