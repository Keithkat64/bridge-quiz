import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import re
from datetime import datetime

# Database setup - commented out until you're ready to implement
# from flask_sqlalchemy import SQLAlchemy
# from sqlalchemy import Column, Integer, String, Float, DateTime

app = Flask(__name__)
CORS(app)  # Enable CORS for all origins

# Database configuration - uncomment when ready to implement
# app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///quiz.db')
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# db = SQLAlchemy(app)

# Database models - uncomment when ready to implement
# class Score(db.Model):
#     id = Column(Integer, primary_key=True)
#     name = Column(String(100), nullable=False)
#     score = Column(Integer, nullable=False)
#     time = Column(Integer, nullable=False)  # Time in seconds
#     post_id = Column(String(50), nullable=False)
#     created_at = Column(DateTime, default=datetime.utcnow)
#
#     def to_dict(self):
#         return {
#             'name': self.name,
#             'score': self.score,
#             'time': self.time
#         }

@app.route('/')
def index():
    return "Hello from Flask on Railway!"

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/quiz/<post_id>', methods=['GET', 'POST'])
def quiz(post_id):
    # Check if quiz data is provided in the request
    if request.method == 'POST' and request.json and 'quiz_data' in request.json:
        # Parse the quiz data from the request
        quiz_data = parse_quiz_data(request.json['quiz_data'])
        
        # Ensure we have at least one hand
        if not quiz_data["hands"]:
            return jsonify({
                "status": "error",
                "message": "No valid quiz hands found in the provided data"
            }), 400
            
        return jsonify({
            "status": "success",
            "post_id": post_id,
            "hands": quiz_data["hands"]
        })
    else:
        # For GET requests, return a simple example
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
                    "bidding": ["North: 1♠", "East: 2♥", "South: ?"],
                    "question": {
                        "text": "Does South bid a) 2S or b) 3S",
                        "options": ["2S", "3S"]
                    },
                    "solution": {
                        "text": "South bids b) 3S. ADD in your shortage points when you hold 4 card support for partner's 5 card suit.",
                        "correct_answer": "b)"
                    }
                }
            ]
        })

    # Check if quiz data is provided in the request
    if request.method == 'POST' and request.json and 'quiz_data' in request.json:
        # Parse the quiz data from the request
        quiz_data = parse_quiz_data(request.json['quiz_data'])
        return jsonify({
            "status": "success",
            "post_id": post_id,
            "hands": quiz_data["hands"]
        })
    else:
        # For GET requests or when no data is provided, return a message
        return jsonify({
            "status": "error",
            "message": "Please provide quiz data in POST request",
            "example": {
                "quiz_data": "Hand 1:\n\nCards:\nNorth: AJT84\nKT53\n94\nAJ\n\nEast: 76\n762\nK63\nKQ963\n\nSouth: 9532\n4\nAQJ5\nT842\n\nWest: KQ\nAQJ98\nT872\n75\n\nDealer: North\n\nBidding:\nNorth: 1♠\nEast: 2♥\nSouth: ?\n\nQuestion:\nDoes South bid a) 2S or b) 3S\n\nSolution:\nSouth bids b) 3S. ADD in your shortage points when you hold 4 card support for partner's 5 card suit."
            }
        })

def parse_quiz_data(content):
    """Parse the bridge quiz data from text format into structured JSON"""
    hands = []
    
    # Split content by the separator
    sections = content.split("----------------------------------------")
    
    for section in sections:
        if "Hand" not in section:
            continue
            
        hand_data = {}
        
        # Extract hand number
        hand_match = re.search(r'Hand (\d+):', section)
        if hand_match:
            hand_data['number'] = int(hand_match.group(1))
        
        # Extract cards
        cards_match = re.search(r'Cards:(.*?)Dealer:', section, re.DOTALL)
        if cards_match:
            cards_text = cards_match.group(1).strip()
            hands_dict = {}
            
            # Parse each position's cards
            positions = ['North', 'East', 'South', 'West']
            for position in positions:
                pos_match = re.search(rf'{position}: (.*?)(?=\n\n|$|\n[A-Z])', cards_text, re.DOTALL)
                if pos_match:
                    card_text = pos_match.group(1).strip()
                    hands_dict[position.lower()] = card_text
            
            hand_data['cards'] = hands_dict
        
        # Extract dealer
        dealer_match = re.search(r'Dealer: (.*?)(?=\n\n|$|\nBidding)', section, re.DOTALL)
        if dealer_match:
            hand_data['dealer'] = dealer_match.group(1).strip()
        
        # Extract bidding
        bidding_match = re.search(r'Bidding:(.*?)Question:', section, re.DOTALL)
        if bidding_match:
            bidding_text = bidding_match.group(1).strip()
            bidding_lines = [line.strip() for line in bidding_text.split('\n') if line.strip()]
            hand_data['bidding'] = bidding_lines
        
        # Extract question
        question_match = re.search(r'Question:(.*?)Solution:', section, re.DOTALL)
        if question_match:
            question_text = question_match.group(1).strip()
            
            # Extract options from question text
            options = []
            options_match = re.search(r'a\)(.*?)b\)(.*?)(?:c\)(.*?))?(?:d\)(.*?))?$', question_text, re.DOTALL)
            if options_match:
                for i in range(1, 5):
                    if i <= options_match.lastindex and options_match.group(i):
                        options.append(options_match.group(i).strip())
            
            hand_data['question'] = {
                'text': question_text,
                'options': options
            }
        
        # Extract solution
        solution_match = re.search(r'Solution:(.*?)$', section, re.DOTALL)
        if solution_match:
            solution_text = solution_match.group(1).strip()
            
            # Extract correct answer
            correct_match = re.search(r'([a-d]\))', solution_text)
            correct_answer = correct_match.group(1) if correct_match else None
            
            hand_data['solution'] = {
                'text': solution_text,
                'correct_answer': correct_answer
            }
        
        hands.append(hand_data)
    
    return {"hands": hands}

@app.route('/api/leaderboard/<post_id>')
def leaderboard(post_id):
    # In a real implementation, query the database for scores
    # For example:
    # scores = Score.query.filter_by(post_id=post_id).order_by(Score.score.desc()).limit(10).all()
    # leaderboard_data = [score.to_dict() for score in scores]
    
    # For now, return empty leaderboard until database is implemented
    return jsonify({
        "status": "success",
        "post_id": post_id,
        "leaderboard": []  # This will be populated from database when implemented
    })

@app.route('/api/submit_score', methods=['POST'])
def submit_score():
    if not request.json:
        return jsonify({"status": "error", "message": "No data provided"}), 400
        
    # Extract score data
    data = request.json
    name = data.get('name', 'Anonymous')
    score = data.get('score', 0)
    time = data.get('time', 0)
    post_id = data.get('post_id')
    
    # In a real implementation, save to database
    # For example:
    # new_score = Score(name=name, score=score, time=time, post_id=post_id)
    # db.session.add(new_score)
    # db.session.commit()
    
    # For now, just return success
    return jsonify({
        "status": "success",
        "message": "Score submitted successfully"
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': 'The requested resource was not found'
    }), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({
        'status': 'error',
        'message': 'An internal server error occurred'
    }), 500

if __name__ == '__main__':
    # Create database tables if using SQLAlchemy
    # db.create_all()
    
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
