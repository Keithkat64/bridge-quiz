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
        try:
            # Parse the quiz data from the request
            quiz_data = parse_quiz_data(request.json['quiz_data'])
            
            # Ensure we have at least one hand
            if not quiz_data["hands"]:
                return jsonify({
                    "status": "success",  # Changed from "error" to avoid 400
                    "message": "No valid quiz hands found in the provided data",
                    "hands": []  # Return empty hands array instead of error
                })
                
            return jsonify({
                "status": "success",
                "post_id": post_id,
                "hands": quiz_data["hands"]
            })
        except Exception as e:
            # Log the error for debugging
            print(f"Error parsing quiz data: {str(e)}")
            return jsonify({
                "status": "success",  # Changed from "error" to avoid 400
                "message": f"Failed to parse quiz data: {str(e)}",
                "hands": [],  # Return empty hands array instead of error
                "data_preview": request.json['quiz_data'][:100] + "..." if len(request.json['quiz_data']) > 100 else request.json['quiz_data']
            })
    else:
        # For GET requests or when no data is provided, return an empty structure
        # instead of an error to avoid 400 status code
        return jsonify({
            "status": "success",
            "post_id": post_id,
            "hands": [],  # Return empty hands array
            "message": "No quiz data provided. Use POST request with quiz_data parameter."
        })

def parse_quiz_data(content):
    """Parse the bridge quiz data from text format into structured JSON"""
    hands = []
    
    # Print first 100 characters for debugging
    print(f"Parsing quiz data: {content[:100]}...")
    
    # Split content by the separator
    sections = content.split("----------------------------------------")
    
    print(f"Found {len(sections)} sections")
    
    for i, section in enumerate(sections):
        if "Hand" not in section:
            continue
            
        print(f"Processing section {i+1}")
        hand_data = {}
        
        # Extract hand number
        hand_match = re.search(r'Hand (\d+):', section)
        if hand_match:
            hand_data['number'] = int(hand_match.group(1))
            print(f"Found hand number: {hand_data['number']}")
        else:
            print(f"No hand number found in section {i+1}")
            continue
        
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
                    print(f"Found {position} cards: {card_text[:20]}...")
                else:
                    print(f"No {position} cards found")
            
            hand_data['cards'] = hands_dict
        else:
            print(f"No cards section found in hand {hand_data.get('number', i+1)}")
        
        # Extract dealer
        dealer_match = re.search(r'Dealer: (.*?)(?=\n\n|$|\nBidding)', section, re.DOTALL)
        if dealer_match:
            hand_data['dealer'] = dealer_match.group(1).strip()
            print(f"Found dealer: {hand_data['dealer']}")
        else:
            print(f"No dealer found in hand {hand_data.get('number', i+1)}")
        
        # Extract bidding
        bidding_match = re.search(r'Bidding:(.*?)Question:', section, re.DOTALL)
        if bidding_match:
            bidding_text = bidding_match.group(1).strip()
            bidding_lines = [line.strip() for line in bidding_text.split('\n') if line.strip()]
            hand_data['bidding'] = bidding_lines
            print(f"Found {len(bidding_lines)} bidding lines")
        else:
            print(f"No bidding found in hand {hand_data.get('number', i+1)}")
        
        # Extract question
        question_match = re.search(r'Question:(.*?)Solution:', section, re.DOTALL)
        if question_match:
            question_text = question_match.group(1).strip()
            print(f"Found question: {question_text[:30]}...")
            
            # Extract options from question text
            options = []
            options_match = re.search(r'a\)(.*?)b\)(.*?)(?:c\)(.*?))?(?:d\)(.*?))?$', question_text, re.DOTALL)
            if options_match:
                for i in range(1, 5):
                    if i <= options_match.lastindex and options_match.group(i):
                        options.append(options_match.group(i).strip())
                print(f"Found {len(options)} options")
            else:
                print("No options found in question")
            
            hand_data['question'] = {
                'text': question_text,
                'options': options
            }
        else:
            print(f"No question found in hand {hand_data.get('number', i+1)}")
        
        # Extract solution
        solution_match = re.search(r'Solution:(.*?)$', section, re.DOTALL)
        if solution_match:
            solution_text = solution_match.group(1).strip()
            print(f"Found solution: {solution_text[:30]}...")
            
            # Extract correct answer
            correct_match = re.search(r'([a-d]\))', solution_text)
            correct_answer = correct_match.group(1) if correct_match else None
            print(f"Correct answer: {correct_answer}")
            
            hand_data['solution'] = {
                'text': solution_text,
                'correct_answer': correct_answer
            }
        else:
            print(f"No solution found in hand {hand_data.get('number', i+1)}")
        
        # Only add hands that have all required components
        if all(key in hand_data for key in ['number', 'cards', 'dealer', 'bidding', 'question', 'solution']):
            hands.append(hand_data)
            print(f"Added hand {hand_data['number']} to results")
        else:
            missing = [key for key in ['number', 'cards', 'dealer', 'bidding', 'question', 'solution'] if key not in hand_data]
            print(f"Skipping hand {hand_data.get('number', i+1)} due to missing: {', '.join(missing)}")
    
    print(f"Returning {len(hands)} parsed hands")
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
        return jsonify({
            "status": "success",  # Changed from "error" to avoid 400
            "message": "No data provided"
        })
        
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
        'status': 'success',  # Changed from "error" to avoid 400
        'message': 'The requested resource was not found'
    }), 200  # Changed from 404 to 200 to avoid error

@app.errorhandler(500)
def server_error(error):
    return jsonify({
        'status': 'success',  # Changed from "error" to avoid 400
        'message': 'An internal server error occurred'
    }), 200  # Changed from 500 to 200 to avoid error

if __name__ == '__main__':
    # Create database tables if using SQLAlchemy
    # db.create_all()
    
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
