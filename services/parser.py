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
                    hands_dict[position.lower()] = card_text
            
            hand_data['cards'] = hands_dict
        
        # Extract other sections (dealer, bidding, question, solution)
        # ... (similar pattern for other sections)
        
        hands.append(hand_data)
    
    return {"hands": hands}
