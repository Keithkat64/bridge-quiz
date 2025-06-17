import re

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
                    # Further parse into suits if needed
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
            
            # Parse options from question
            options = []
            options_match = re.search(r'a\)(.*?)b\)(.*?)(?:c\)(.*?))?(?:d\)(.*?))?$', question_text, re.DOTALL)
            if options_match:
                for i in range(1, 5):
                    if options_match.group(i):
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
