from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return "Hello from Flask on Railway!"

@app.route('/api/quiz/1')
def quiz_one():
    return jsonify({"status": "success", "message": "This is quiz 1"})

@app.route('/api/quiz/<post_id>')
def quiz(post_id):
    return jsonify({"status": "success", "post_id": post_id})

if __name__ == '__main__':
    app.run(debug=True)
