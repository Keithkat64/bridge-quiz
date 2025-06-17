from flask import Blueprint, jsonify, request
from services.parser import parse_quiz_data
from services.quiz_service import get_quiz_data, submit_answer, get_leaderboard

quiz_bp = Blueprint('quiz', __name__)

@quiz_bp.route('/quiz/<post_id>', methods=['GET'])
def get_quiz(post_id):
    # In a real implementation, you would fetch the quiz data from WordPress
    # For now, we'll use mock data
    quiz_data = get_quiz_data(post_id)
    return jsonify(quiz_data)

@quiz_bp.route('/submit/<post_id>', methods=['POST'])
def submit(post_id):
    data = request.json
    result = submit_answer(post_id, data)
    return jsonify(result)

@quiz_bp.route('/leaderboard/<post_id>', methods=['GET'])
def leaderboard(post_id):
    leaderboard_data = get_leaderboard(post_id)
    return jsonify(leaderboard_data)
