document.addEventListener('DOMContentLoaded', function() {
    console.log('Quiz script loaded v12.0.0 - Fixed Module Detection');

    // --- HARDCODED QUIZ DATA ---
    const quizRawData = `Hand 1:

Cards:
North: AJT84
KT53
94
AJ

East: 76
762
K63
KQ963

South: 9532
4
AQJ5
T842

West: KQ
AQJ98
T872
75

Dealer: North

Bidding:
North: 1♠
East: 2♥
South: ?

Question:
Does South bid a) 2S or b) 3S or c) 4S

Solution:
South bids b) 3S. ADD in your shortage points when you hold 4 card support for partner's 5 card suit.

----------------------------------------

Hand 2:

Cards:
North: T9654
9
KQ63
T86

East: KJ7
AKJT53
A97
7

South: AQ8
Q872
84
AJ53

West: 32
64
JT52
KQ942

Dealer: East

Bidding:
East: 1♥
South: ?

Question:
Does South bid a) Dble b) Pass or c) 2C

Solution:
South bids b) Pass. You have too many hearts for a takeout double, and not enough clubs for an overcall of 2C.

----------------------------------------

Hand 3:

Cards:
North: KQJ5
AK852
JT9
Q

East: T6
J73
A53
KT862

South: A974
96
KQ876
73

West: 832
QT4
42
AJ954

Dealer: South

Bidding:
South: Pass
West: Pass
North: 1♥
East: Pass
South: ?

Question:
Does South bid a) 1S b) 1NT or c) 2D

Solution:
South bids a) 1S. Bidding 1NT denies four spades and bidding at the 2 level shows 10+ hcp.

----------------------------------------

Hand 4:

Cards:
North: AT96
AK653
Q8
T8

East: Q53
J
A6543
KQ63

South: 84
Q8742
K2
A975

West: KJ72
T9
JT97
J42

Dealer: North

Bidding:
North: 1♥
East: Pass
South: ?

Question:
Does South bid a) 2H b) 3H or c) 4H

Solution:
South bids b) 3H. ADD in your shortage points when you hold 5 card support for partner's 5 card suit.

----------------------------------------

Hand 5:

Cards:
North: A8653
KT632
K7
3

East: QJ7
AJ84
T6
Q876

South: KT42
void
AQ8542
KJ5

West: 9
Q975
J93
AT942

Dealer: South

Bidding:
South: 1♦
West: Pass
North: 1♠
East: Pass
South: ?

Question:
Does South bid a) 2S b) 3S or c) 4S

Solution:
South bids b) 3S. When you have a fit, ADD in your shortage points. Your hand is now worth 18 tp, so jump to 3S to show 16-18. North will have no trouble going onto game.

----------------------------------------

Hand 6:

Cards:
North: JT63
JT82
T5
K82

East: KQ87542
63
Q9
Q5

South: void
AK54
AJ84
AJT43

West: A9
Q97
976
K7632

Dealer: East

Bidding:
East: 3♠
South: Dbl
West: Pass
North: 4♥
East: Pass
South: ?

Question:
Does South bid a) Pass b) 4NT or c) 6H

Solution:
South bids a) Pass. Partner is not promising any points for their 4H bid, so it's too risky to try for slam.

----------------------------------------

Hand 7:

Cards:
North: AQJ97
Q7
Q73
K92

East: T654
J54
J6
K954

South: K3
AKT83
T2
AQ74

West: 82
962
AJ86
T853

Dealer: North

Bidding:
North: 1♠
East: Pass
South: 2♥
West: Pass
North: 2NT
East: Pass
South: ?

Question:
Does South bid a) 3C b) 3NT or c) 4NT

Solution:
South bids either a) 3C or b) 3NT. North is not promising a balanced hand, so bidding 3C covers all contingencies.

----------------------------------------

Hand 8:

Cards:
North: AKQ9
A6
Q93
J852

East: 65
8532
T
AQT643

South: T873
KJT9
AJ75
9

West: J42
Q74
K8642
K7

Dealer: North

Bidding:
North: 1NT
East: 2♣
South: ?

Question:
Does South bid a) 2NT b) 3C or c) 3NT

Solution:
South bids c) 3C best or b) 2NT. 3C is a cue bid and promises a 4 card major. If North holds a 4 card major, they will bid it.

----------------------------------------

Hand 9:

Cards:
North: 96
J652
J9642
97

East: AK4
T984
J3
AQT7

South: QJT872
KQ7
K8
T8

West: 53
A3
53
AKQ6542

Dealer: East

Bidding:
East: 1♦
South: ?

Question:
Does South bid a) Pass b) 1S or c) 2S

Solution:
South bids b) 1S. You have too many points to overcall 2S and you want partner to lead a spade if they are on lead.

----------------------------------------

Hand 10:

Cards:
North: AJ3
KQ8
KQJ52
K2

East: K72
632
9763
A65

South: Q9854
AT75
T4
Q8

West: T6
J94
A8
JT9743

Dealer: North

Bidding:
North: 1♦
East: Pass
South:  1♠
West: Pass
North: 2NT
East: Pass
South: ?

Question:
Does South bid a) Pass b) 3H b) 3S or c) 3NT

Solution:
South bids b) 3H. This shows 5 spades and 4 hearts and offers West a choice of 3 contracts: 3NT, 4H or 4S.

----------------------------------------`;

    // Quiz state
    let quizData = null;
    let currentQuestion = 0;
    let userScore = 0;
    let userAnswers = [];
    let userInfo = {
        firstName: 'Guest',
        lastName: 'Player'
    };
    let selectedOption = null;

    // --- Improved Module Element References ---
    function findModuleByContent(searchText) {
        // Look for any element containing the search text
        const elements = document.querySelectorAll('*');
        for (const element of elements) {
            if (element.textContent && element.textContent.trim().includes(searchText)) {
                // Find the closest section or div that acts as a module container
                let container = element.closest('section');
                if (!container) {
                    container = element.closest('.elementor-section');
                }
                if (!container) {
                    container = element.closest('.elementor-widget');
                }
                if (!container) {
                    container = element.closest('div[class*="elementor"]');
                }
                if (container) {
                    return container;
                }
            }
        }
        return null;
    }

    // Find modules with improved detection
    const registrationModule = findModuleByContent('Quiz Registration');
    const questionboxModule = findModuleByContent('Question 1');
    const correctBoxModule = findModuleByContent('✅Correct') || findModuleByContent('Correct');
    const wrongBoxModule = findModuleByContent('❌Incorrect') || findModuleByContent('Incorrect');
    const leaderboardModule = findModuleByContent('🏆 Leaderboard') || findModuleByContent('Leaderboard');

    console.log('Found modules:', {
        registration: !!registrationModule,
        questionbox: !!questionboxModule,
        correctBox: !!correctBoxModule,
        wrongBox: !!wrongBoxModule,
        leaderboard: !!leaderboardModule
    });

    // --- Question Box Module Elements with fallback selectors ---
    function findElementInModule(module, selectors) {
        if (!module) return null;
        
        for (const selector of selectors) {
            const element = module.querySelector(selector);
            if (element) return element;
        }
        return null;
    }

    // Find elements within modules
    const questionNumberField = findElementInModule(questionboxModule, [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        '.elementor-heading-title',
        '[class*="heading"]'
    ]);

    const southHandBox = findElementInModule(questionboxModule, [
        '.hand-box',
        '.elementor-text-editor p',
        '.elementor-widget-text-editor',
        'div:contains("South holds")',
        'p:contains("♠")'
    ]);

    const biddingBox = findElementInModule(questionboxModule, [
        '.bidding-box',
        'table',
        '.elementor-widget-table',
        'div:contains("West")'
    ]);

    const optionsBox = findElementInModule(questionboxModule, [
        '.options-container',
        '.elementor-button-wrapper',
        'div:contains("A")',
        'div:contains("2S")'
    ]);

    console.log('Question elements found:', {
        questionNumberField: !!questionNumberField,
        southHandBox: !!southHandBox,
        biddingBox: !!biddingBox,
        optionsBox: !!optionsBox
    });

    // Create dynamic elements if not found
    function createMissingElements() {
        if (questionboxModule && !southHandBox) {
            const handDiv = document.createElement('div');
            handDiv.className = 'hand-box';
            questionboxModule.appendChild(handDiv);
        }
        
        if (questionboxModule && !biddingBox) {
            const biddingDiv = document.createElement('div');
            biddingDiv.className = 'bidding-box';
            questionboxModule.appendChild(biddingDiv);
        }
        
        if (questionboxModule && !optionsBox) {
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'options-container';
            questionboxModule.appendChild(optionsDiv);
        }
    }

    // --- Parsing and Formatting Functions ---
    function parseQuizData(rawData) {
        console.log('Parsing quiz data...');
        const hands = [];
        const handSections = rawData.split('----------------------------------------');

        handSections.forEach(section => {
            if (!section.trim()) return;

            const hand = {};

            // Extract hand number
            const handMatch = section.match(/Hand (\d+):/);
            if (handMatch) {
                hand.number = parseInt(handMatch[1]);
            }

            // Extract cards
            hand.allHands = {};
            const cardsSection = section.match(/Cards:([^Dealer]+)/s);
            if (cardsSection) {
                const cardLines = cardsSection[1].trim().split('\n');
                let currentPosition = '';
                cardLines.forEach(line => {
                    const positionMatch = line.match(/(North|East|South|West):(.*)/);
                    if (positionMatch) {
                        currentPosition = positionMatch[1].toLowerCase();
                        const cardData = positionMatch[2].trim();
                        const cards = cardData.split(/\s+/);
                        if (cards.length >= 4) {
                            hand.allHands[currentPosition] = `♠ ${cards[0]}\n♥ ${cards[1]}\n♦ ${cards[2]}\n♣ ${cards[3]}`;
                        }
                    }
                });
            }

            // Extract bidding
            hand.bidding = [];
            const biddingSection = section.match(/Bidding:([^Question]+)/s);
            if (biddingSection) {
                const biddingLines = biddingSection[1].trim().split('\n');
                biddingLines.forEach(line => {
                    if (line.trim()) {
                        hand.bidding.push(line.trim());
                    }
                });
            }

            // Extract question and options
            const questionMatch = section.match(/Question:([^Solution]+)/s);
            if (questionMatch) {
                hand.question = questionMatch[1].trim();
                hand.options = {};
                const optionsMatch = hand.question.match(/Does South bid ([^]+)/);
                if (optionsMatch) {
                    const optionsText = optionsMatch[1];
                    const optionRegex = /([a-d])\) ([^a-d\)]+)/g;
                    let optionMatch;
                    while ((optionMatch = optionRegex.exec(optionsText)) !== null) {
                        const letter = optionMatch[1];
                        const text = optionMatch[2].trim();
                        hand.options[letter] = text;
                    }
                }
            }

            // Extract solution
            const solutionMatch = section.match(/Solution:([^-]+)/s);
            if (solutionMatch) {
                hand.solution = solutionMatch[1].trim();
                const correctAnswerMatch = hand.solution.match(/South bids ([a-d])\)/);
                if (correctAnswerMatch) {
                    hand.correctAnswer = correctAnswerMatch[1];
                }
            }
            
            if (hand.number) {
                hands.push(hand);
            }
        });
        return hands;
    }

    function formatSouthHand(handText) {
        if (!handText) return '';
        const lines = handText.split('\n');
        let html = '<div class="south-hand-display"><span class="south-label">South holds</span><br>';
        lines.forEach(line => {
            const parts = line.split(' ');
            if (parts.length >= 2) {
                const suit = parts[0];
                const cards = parts.slice(1).join(' ');
                let suitClass = 'spades';
                if (suit === '♥') suitClass = 'hearts';
                if (suit === '♦') suitClass = 'diamonds';
                if (suit === '♣') suitClass = 'clubs';
                html += `<span class="${suitClass}">${suit}</span> <span class="cards">${cards}</span><br>`;
            }
        });
        html += '</div>';
        return html;
    }

    function formatBidding(bidding) {
        if (!bidding || bidding.length === 0) return '';
        
        // Convert bidding array to table format
        let html = '<table class="bidding-table"><tr><th>West</th><th>North</th><th>East</th><th>South</th></tr>';
        
        // Parse bidding sequence
        const bids = [];
        bidding.forEach(line => {
            const parts = line.split(':');
            if (parts.length === 2) {
                const position = parts[0].trim();
                const bid = parts[1].trim();
                bids.push({ position: position, bid: bid });
            }
        });
        
        // Create table row
        const positions = ['West', 'North', 'East', 'South'];
        let row = '<tr>';
        positions.forEach(pos => {
            const bidEntry = bids.find(b => b.position === pos);
            const bidText = bidEntry ? bidEntry.bid : '-';
            row += `<td>${bidText}</td>`;
        });
        row += '</tr>';
        html += row + '</table>';
        
        return html;
    }

    function formatOptions(options) {
        if (!options) return '';
        let html = '<div class="options-wrapper">';
        
        Object.keys(options).forEach(letter => {
            html += `<div class="option-btn" data-option="${letter}">
                <span class="option-letter">${letter.toUpperCase()}</span>
                <span class="option-text">${options[letter]}</span>
            </div>`;
        });
        
        html += '<button class="see-answer-btn" id="seeAnswerBtn" style="display:none;">See Solution</button>';
        html += '</div>';
        return html;
    }

    function formatDiamondHand(hands) {
        if (!hands) return '';
        
        const formatCards = (cardsText) => {
            if (!cardsText) return '';
            return cardsText.split('\n').map(line => {
                const parts = line.split(' ');
                if (parts.length >= 2) {
                    const suit = parts[0];
                    const cards = parts.slice(1).join(' ');
                    let suitClass = suit === '♥' || suit === '♦' ? 'red-suit' : 'black-suit';
                    return `<span class="${suitClass}">${suit}</span> ${cards}`;
                }
                return line;
            }).join('<br>');
        };

        return `
            <div class="diamond-hand-display">
                <div class="north-hand">
                    <div class="hand-label">North</div>
                    <div class="hand-cards">${formatCards(hands.north)}</div>
                </div>
                <div class="middle-hands">
                    <div class="west-hand">
                        <div class="hand-label">West</div>
                        <div class="hand-cards">${formatCards(hands.west)}</div>
                    </div>
                    <div class="east-hand">
                        <div class="hand-label">East</div>
                        <div class="hand-cards">${formatCards(hands.east)}</div>
                    </div>
                </div>
                <div class="south-hand">
                    <div class="hand-label">South</div>
                    <div class="hand-cards">${formatCards(hands.south)}</div>
                </div>
            </div>
        `;
    }

    // --- Core Quiz Functions ---
    function initQuiz() {
        console.log('Initializing quiz...');
        
        // Parse quiz data
        quizData = parseQuizData(quizRawData);
        console.log('Quiz data loaded:', quizData.length, 'questions');
        
        // Create missing elements if needed
        createMissingElements();
        
        // Hide all modules except question module
        hideAllModules();
        
        // Add CSS
        addDynamicCSS();
        
        // Start quiz directly
        startQuiz();
    }

    function startQuiz() {
        console.log('Starting quiz...');
        currentQuestion = 0;
        userScore = 0;
        userAnswers = [];
        selectedOption = null;
        
        hideAllModules();
        showQuestion(currentQuestion);
    }

    function showQuestion(index) {
        if (!quizData || !quizData[index]) {
            console.error('Question data not available for index:', index);
            return;
        }
        
        const question = quizData[index];
        console.log('Showing question:', index + 1, question);
        
        // Update question number
        if (questionNumberField) {
            questionNumberField.textContent = `Question ${index + 1}`;
        }
        
        // Update South hand
        const handElement = questionboxModule?.querySelector('.hand-box') || southHandBox;
        if (handElement && question.allHands?.south) {
            handElement.innerHTML = formatSouthHand(question.allHands.south);
        }
        
        // Update bidding
        const biddingElement = questionboxModule?.querySelector('.bidding-box') || biddingBox;
        if (biddingElement && question.bidding) {
            biddingElement.innerHTML = formatBidding(question.bidding);
        }
        
        // Update options
        const optionsElement = questionboxModule?.querySelector('.options-container') || optionsBox;
        if (optionsElement && question.options) {
            optionsElement.innerHTML = formatOptions(question.options);
            
            // Add event listeners to option buttons
            const optionButtons = optionsElement.querySelectorAll('.option-btn');
            optionButtons.forEach(btn => {
                btn.addEventListener('click', () => selectOption(btn.dataset.option, btn));
            });
            
            // Add event listener to see answer button
            const seeAnswerBtn = optionsElement.querySelector('#seeAnswerBtn');
            if (seeAnswerBtn) {
                seeAnswerBtn.addEventListener('click', showAnswer);
            }
        }
        
        // Reset selection state
        selectedOption = null;
        
        // Show question module
        if (questionboxModule) {
            questionboxModule.style.display = 'block';
        }
    }

    function selectOption(optionValue, element) {
        // Remove selection from all options
        const allOptions = questionboxModule?.querySelectorAll('.option-btn') || [];
        allOptions.forEach(btn => btn.classList.remove('selected'));
        
        // Select this option
        element.classList.add('selected');
        selectedOption = optionValue;
        
        // Show see answer button
        const seeAnswerBtn = questionboxModule?.querySelector('#seeAnswerBtn');
        if (seeAnswerBtn) {
            seeAnswerBtn.style.display = 'block';
        }
        
        console.log('Selected option:', optionValue);
    }

    function showAnswer() {
        if (!selectedOption) {
            console.log('No option selected');
            return;
        }

        const question = quizData[currentQuestion];
        const isCorrect = selectedOption === question.correctAnswer;
        
        console.log('Answer check:', selectedOption, 'vs', question.correctAnswer, '=', isCorrect);
        
        // Record answer
        userAnswers.push({
            question: currentQuestion,
            answer: selectedOption,
            correct: isCorrect
        });
        
        if (isCorrect) {
            userScore++;
        }
        
        // Hide question module
        if (questionboxModule) {
            questionboxModule.style.display = 'none';
        }
        
        // Show appropriate solution module
        const targetModule = isCorrect ? correctBoxModule : wrongBoxModule;
        if (targetModule) {
            // Update solution text
            const solutionElement = targetModule.querySelector('.solution-text') || 
                                  targetModule.querySelector('p') ||
                                  targetModule.querySelector('div');
            
            if (solutionElement) {
                const diamondHtml = formatDiamondHand(question.allHands);
                solutionElement.innerHTML = question.solution + '<br><br>' + diamondHtml;
            }
            
            // Add next button if not exists
            if (!targetModule.querySelector('.next-question-btn')) {
                const nextBtn = document.createElement('button');
                nextBtn.className = 'next-question-btn';
                nextBtn.textContent = 'Next Question';
                nextBtn.addEventListener('click', nextQuestion);
                targetModule.appendChild(nextBtn);
            }
            
            targetModule.style.display = 'block';
        }
    }

    function nextQuestion() {
        // Hide solution modules
        if (correctBoxModule) correctBoxModule.style.display = 'none';
        if (wrongBoxModule) wrongBoxModule.style.display = 'none';
        
        currentQuestion++;
        
        if (currentQuestion >= quizData.length) {
            showLeaderboard();
        } else {
            showQuestion(currentQuestion);
        }
    }

    function showLeaderboard() {
        hideAllModules();
        
        if (leaderboardModule) {
            // Update leaderboard content
            const scoreDisplay = leaderboardModule.querySelector('p') || 
                               leaderboardModule.querySelector('div');
            
            if (scoreDisplay) {
                scoreDisplay.innerHTML = `
                    <h2>Quiz Complete!</h2>
                    <p>Your Score: ${userScore} out of ${quizData.length}</p>
                    <p>Percentage: ${Math.round((userScore / quizData.length) * 100)}%</p>
                    <button class="finish-quiz-btn" onclick="location.reload()">Take Quiz Again</button>
                `;
            }
            
            leaderboardModule.style.display = 'block';
        }
        
        console.log('Quiz completed. Score:', userScore, '/', quizData.length);
    }

    function hideAllModules() {
        const modules = [registrationModule, questionboxModule, correctBoxModule, wrongBoxModule, leaderboardModule];
        modules.forEach(module => {
            if (module) {
                module.style.display = 'none';
            }
        });
    }

    function addDynamicCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Quiz Module Styling */
            .south-hand-display {
                background-color: #f9f9f9;
                border: 1px solid #e0e0e0;
                border-radius: 5px;
                padding: 15px;
                margin: 15px 0;
                font-family: monospace;
                font-size: 16px;
                line-height: 1.5;
                text-align: center;
            }
            
            .south-label {
                font-weight: bold;
                display: block;
                margin-bottom: 10px;
            }
            
            .spades, .clubs {
                color: black;
                font-weight: bold;
            }
            
            .hearts, .diamonds, .red-suit {
                color: red;
                font-weight: bold;
            }
            
            .black-suit {
                color: black;
                font-weight: bold;
            }
            
            .cards {
                letter-spacing: 1px;
            }
            
            .bidding-table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
                font-family: Arial, sans-serif;
            }
            
            .bidding-table th,
            .bidding-table td {
                border: 1px solid #4CA6A8;
                padding: 8px 12px;
                text-align: center;
            }
            
            .bidding-table th {
                background-color: #4CA6A8;
                color: white;
                font-weight: bold;
            }
            
            .options-wrapper {
                margin: 20px 0;
            }
            
            .option-btn {
                display: flex;
                align-items: center;
                background-color: #f5f5f5;
                border: 2px solid #ddd;
                border-radius: 8px;
                padding: 12px 15px;
                margin: 8px 0;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .option-btn:hover {
                background-color: #e8f4f8;
                border-color: #4CA6A8;
            }
            
            .option-btn.selected {
                background-color: #e0f7fa;
                border-color: #4CAF50;
                box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
            }
            
            .option-letter {
                background-color: #4CA6A8;
                color: white;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                margin-right: 12px;
                font-size: 14px;
            }
            
            .option-text {
                font-size: 16px;
                flex: 1;
            }
            
            .see-answer-btn,
            .next-question-btn,
            .finish-quiz-btn {
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                padding: 12px 20px;
                margin: 15px 0;
                cursor: pointer;
                font-size: 16px;
                font-weight: 500;
                transition: all 0.3s ease;
            }
            
            .see-answer-btn:hover,
            .next-question-btn:hover,
            .finish-quiz-btn:hover {
                background-color: #45a049;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            }
            
            .diamond-hand-display {
                border: 2px solid #4CA6A8;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                background-color: #f9f9f9;
                font-family: monospace;
                font-size: 14px;
            }
            
            .diamond-hand-display .north-hand,
            .diamond-hand-display .south-hand {
                text-align: center;
                margin: 15px 0;
            }
            
            .diamond-hand-display .middle-hands {
                display: flex;
                justify-content: space-between;
                margin: 20px 0;
            }
            
            .diamond-hand-display .west-hand,
            .diamond-hand-display .east-hand {
                flex: 1;
                text-align: center;
            }
            
            .diamond-hand-display .hand-label {
                font-weight: bold;
                font-size: 16px;
                margin-bottom: 8px;
                text-decoration: underline;
            }
            
            .diamond-hand-display .hand-cards {
                line-height: 1.4;
            }
            
            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .diamond-hand-display .middle-hands {
                    flex-direction: column;
                    gap: 15px;
                }
                
                .option-btn {
                    padding: 10px 12px;
                }
                
                .option-letter {
                    width: 24px;
                    height: 24px;
                    font-size: 12px;
                    margin-right: 8px;
                }
                
                .option-text {
                    font-size: 14px;
                }
                
                .bidding-table th,
                .bidding-table td {
                    padding: 6px 8px;
                    font-size: 14px;
                }
                
                .south-hand-display {
                    font-size: 14px;
                    padding: 12px;
                }
                
                .diamond-hand-display {
                    padding: 15px;
                    font-size: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize the quiz when DOM is ready
    initQuiz();
});