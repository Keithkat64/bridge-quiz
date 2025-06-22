document.addEventListener('DOMContentLoaded', function() {
    console.log('Quiz script loaded v4.0.0 - Custom Registration Form');
    
    // Quiz state
    let quizData = null;
    let currentQuestion = 0;
    let userScore = 0;
    let userAnswers = [];
    let userInfo = {
        firstName: '',
        lastName: ''
    };
    let selectedOption = null;
    
    // Find all sections by their IDs
    const registrationSection = document.getElementById('registration');
    const questionSection = document.getElementById('questionbox');
    const correctSection = document.getElementById('correctBox');
    const incorrectSection = document.getElementById('wrongBox');
    const leaderboardSection = document.getElementById('leaderboard');
    
    console.log('Found sections by ID:', {
        registration: !!registrationSection,
        question: !!questionSection,
        correct: !!correctSection,
        incorrect: !!incorrectSection,
        leaderboard: !!leaderboardSection
    });
    
    // Find form elements in the custom registration form
    const registrationForm = document.getElementById('quiz-registration-form');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const startQuizButton = document.getElementById('startquizbtn');
    
    console.log('Found form elements:', {
        form: !!registrationForm,
        firstName: !!firstNameInput,
        lastName: !!lastNameInput,
        startButton: !!startQuizButton
    });
    
    // Find question elements
    const questionNumberButton = questionSection ? questionSection.querySelector('button') : null;
    const southHandDiv = questionSection ? questionSection.querySelector('div:contains("South holds")') : null;
    const biddingDiv = questionSection ? questionSection.querySelector('div:contains("West")') : null;
    const optionA = questionSection ? questionSection.querySelector('div:contains("A")') : null;
    const optionB = questionSection ? questionSection.querySelector('div:contains("B")') : null;
    const optionC = questionSection ? questionSection.querySelector('div:contains("C")') : null;
    const seeAnswerButton = questionSection ? questionSection.querySelector('button:contains("See")') : null;
    
    // Find solution elements
    const correctSolutionDiv = correctSection ? correctSection.querySelector('div:nth-of-type(1)') : null;
    const incorrectSolutionDiv = incorrectSection ? incorrectSection.querySelector('div:nth-of-type(1)') : null;
    const nextButtonCorrect = correctSection ? correctSection.querySelector('button') : null;
    const nextButtonIncorrect = incorrectSection ? incorrectSection.querySelector('button') : null;
    
    // Find leaderboard elements
    const leaderboardTable = leaderboardSection ? leaderboardSection.querySelector('table') : null;
    const finishButton = leaderboardSection ? leaderboardSection.querySelector('button') : null;
    
    // Get quiz data
    const quizDataInput = document.getElementById('quiz-data');
    
    // Initialize the quiz
    function initQuiz() {
        console.log('Initializing quiz...');
        
        // Load quiz data
        if (quizDataInput) {
            quizData = parseQuizData(quizDataInput.value);
            console.log('Quiz data loaded:', quizData.length, 'questions');
        } else {
            console.error('Quiz data input not found');
            return;
        }
        
        // Hide all sections except registration
        hideAllSections();
        if (registrationSection) {
            registrationSection.style.display = 'block';
        }
        
        // Set up form submission
        if (registrationForm) {
            registrationForm.addEventListener('submit', function(e) {
                e.preventDefault();
                startQuiz();
            });
        }
        
        // Add event listeners to options
        if (optionA) {
            optionA.addEventListener('click', function() {
                selectOption('a', this);
            });
        }
        
        if (optionB) {
            optionB.addEventListener('click', function() {
                selectOption('b', this);
            });
        }
        
        if (optionC) {
            optionC.addEventListener('click', function() {
                selectOption('c', this);
            });
        }
        
        // Add event listener to see answer button
        if (seeAnswerButton) {
            seeAnswerButton.addEventListener('click', showAnswer);
        }
        
        // Add event listeners to next buttons
        if (nextButtonCorrect) {
            nextButtonCorrect.addEventListener('click', nextQuestion);
        }
        
        if (nextButtonIncorrect) {
            nextButtonIncorrect.addEventListener('click', nextQuestion);
        }
        
        // Add event listener to finish button
        if (finishButton) {
            finishButton.addEventListener('click', finishQuiz);
        }
        
        // Add CSS for diamond hand display
        addDiamondHandCSS();
    }
    
    // Parse quiz data
    function parseQuizData(rawData) {
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
                        
                        // Format the hand with suit symbols
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
            
            // Extract question
            const questionMatch = section.match(/Question:([^Solution]+)/s);
            if (questionMatch) {
                hand.question = questionMatch[1].trim();
                
                // Parse options
                hand.options = {};
                const optionsMatch = hand.question.match(/Does South bid ([^]+)/);
                if (optionsMatch) {
                    const optionsText = optionsMatch[1];
                    
                    // Extract individual options
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
                
                // Extract correct answer
                const correctAnswerMatch = hand.solution.match(/South bids ([a-d])\)/);
                if (correctAnswerMatch) {
                    hand.correctAnswer = correctAnswerMatch[1];
                }
            }
            
            hands.push(hand);
        });
        
        return hands;
    }
    
    // Start the quiz
    function startQuiz() {
        // Save user info
        userInfo.firstName = firstNameInput ? firstNameInput.value.trim() : 'Guest';
        userInfo.lastName = lastNameInput ? lastNameInput.value.trim() : '';
        
        console.log('Starting quiz for:', userInfo.firstName, userInfo.lastName);
        
        // Reset quiz state
        currentQuestion = 0;
        userScore = 0;
        userAnswers = [];
        
        // Hide registration and show first question
        hideAllSections();
        showQuestion(currentQuestion);
    }
    
    // Show a specific question
    function showQuestion(index) {
        if (!quizData || !quizData[index]) {
            console.error('Question data not available for index:', index);
            return;
        }
        
        const question = quizData[index];
        
        // Update question number button
        if (questionNumberButton) {
            questionNumberButton.textContent = `Question ${index + 1}`;
            console.log('Updated question number button to:', `Question ${index + 1}`);
        }
        
        // Update South hand
        if (southHandDiv && question.allHands && question.allHands.south) {
            southHandDiv.innerHTML = `South holds<br>${question.allHands.south.replace(/\n/g, '<br>')}`;
        }
        
        // Update bidding
        if (biddingDiv && question.bidding) {
            biddingDiv.innerHTML = question.bidding.join('<br>');
        }
        
        // Update options
        if (optionA && question.options && question.options.a) {
            optionA.textContent = `option a) ${question.options.a}`;
            optionA.classList.remove('selected');
        }
        
        if (optionB && question.options && question.options.b) {
            optionB.textContent = `option b) ${question.options.b}`;
            optionB.classList.remove('selected');
        }
        
        if (optionC) {
            if (question.options && question.options.c) {
                optionC.textContent = `option c) ${question.options.c}`;
                optionC.style.display = 'block';
                optionC.classList.remove('selected');
            } else {
                optionC.style.display = 'none';
            }
        }
        
        // Reset selected option
        selectedOption = null;
        
        // Disable see answer button
        if (seeAnswerButton) {
            seeAnswerButton.disabled = true;
        }
        
        // Show question section
        questionSection.style.display = 'block';
    }
    
    // Select an option
    function selectOption(option, element) {
        // Remove selected class from all options
        if (optionA) optionA.classList.remove('selected');
        if (optionB) optionB.classList.remove('selected');
        if (optionC) optionC.classList.remove('selected');
        
        // Add selected class to clicked option
        element.classList.add('selected');
        
        // Store selected option
        selectedOption = option;
        
        // Enable see answer button
        if (seeAnswerButton) {
            seeAnswerButton.disabled = false;
        }
    }
    
    // Show answer
    function showAnswer() {
        if (!selectedOption) {
            return;
        }
        
        const question = quizData[currentQuestion];
        const isCorrect = selectedOption === question.correctAnswer;
        
        // Save answer
        userAnswers.push({
            question: currentQuestion,
            answer: selectedOption,
            correct: isCorrect
        });
        
        // Update score
        if (isCorrect) {
            userScore++;
        }
        
        // Hide question section
        questionSection.style.display = 'none';
        
        // Show appropriate answer section
        if (isCorrect) {
            // Update solution text
            if (correctSolutionDiv) {
                correctSolutionDiv.innerHTML = question.solution;
            }
            
            // Add diamond hand display
            const diamondHandContainer = document.createElement('div');
            diamondHandContainer.innerHTML = formatDiamondHand(question.allHands);
            diamondHandContainer.className = 'diamond-hand-container';
            correctSection.appendChild(diamondHandContainer);
            
            // Show correct section
            correctSection.style.display = 'block';
        } else {
            // Update solution text
            if (incorrectSolutionDiv) {
                incorrectSolutionDiv.innerHTML = question.solution;
            }
            
            // Add diamond hand display
            const diamondHandContainer = document.createElement('div');
            diamondHandContainer.innerHTML = formatDiamondHand(question.allHands);
            diamondHandContainer.className = 'diamond-hand-container';
            incorrectSection.appendChild(diamondHandContainer);
            
            // Show incorrect section
            incorrectSection.style.display = 'block';
        }
    }
    
    // Format diamond hand
    function formatDiamondHand(hands) {
        if (!hands) return '';
        
        return `
            <div class="diamond-hand">
                <div class="north">${hands.north ? hands.north.replace(/\n/g, '<br>') : ''}</div>
                <div class="hand-middle">
                    <div class="west">${hands.west ? hands.west.replace(/\n/g, '<br>') : ''}</div>
                    <div class="east">${hands.east ? hands.east.replace(/\n/g, '<br>') : ''}</div>
                </div>
                <div class="south">${hands.south ? hands.south.replace(/\n/g, '<br>') : ''}</div>
            </div>
        `;
    }
    
    // Go to next question
    function nextQuestion() {
        // Hide answer sections
        if (correctSection) correctSection.style.display = 'none';
        if (incorrectSection) incorrectSection.style.display = 'none';
        
        // Remove diamond hand displays
        document.querySelectorAll('.diamond-hand-container').forEach(el => el.remove());
        
        // Increment question index
        currentQuestion++;
        
        // Check if quiz is complete
        if (currentQuestion >= quizData.length) {
            showLeaderboard();
        } else {
            showQuestion(currentQuestion);
        }
    }
    
    // Show leaderboard
    function showLeaderboard() {
        hideAllSections();
        
        // Save score
        const userFullName = `${userInfo.firstName} ${userInfo.lastName}`;
        saveScoreToLocalStorage(userFullName, userScore);
        
        // Update leaderboard display
        updateLeaderboardDisplay();
        
        // Show leaderboard section
        if (leaderboardSection) {
            leaderboardSection.style.display = 'block';
        }
    }
    
    // Save score to local storage
    function saveScoreToLocalStorage(name, score) {
        let scores = JSON.parse(localStorage.getItem('quizScores') || '[]');
        
        scores.push({
            name: name,
            score: score,
            date: new Date().toISOString()
        });
        
        scores.sort((a, b) => b.score - a.score);
        scores = scores.slice(0, 10);
        
        localStorage.setItem('quizScores', JSON.stringify(scores));
    }
    
    // Update leaderboard display
    function updateLeaderboardDisplay() {
        if (!leaderboardTable) return;
        
        const scores = JSON.parse(localStorage.getItem('quizScores') || '[]');
        
        let tableHTML = '';
        
        // Add score rows
        scores.forEach((score, index) => {
            tableHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${score.name}</td>
                    <td>${score.score}</td>
                </tr>
            `;
        });
        
        // Fill remaining rows
        for (let i = scores.length; i < 10; i++) {
            tableHTML += `
                <tr>
                    <td>${i + 1}</td>
                    <td></td>
                    <td></td>
                </tr>
            `;
        }
        
        // Update table
        leaderboardTable.innerHTML = tableHTML;
    }
    
    // Finish quiz
    function finishQuiz() {
        hideAllSections();
        
        // Clear inputs
        if (firstNameInput) firstNameInput.value = '';
        if (lastNameInput) lastNameInput.value = '';
        
        // Hide start button again
        if (startQuizButton) {
            startQuizButton.style.display = 'none';
        }
        
        // Show registration section
        if (registrationSection) {
            registrationSection.style.display = 'block';
        }
    }
    
    // Hide all sections
    function hideAllSections() {
        if (registrationSection) registrationSection.style.display = 'none';
        if (questionSection) questionSection.style.display = 'none';
        if (correctSection) correctSection.style.display = 'none';
        if (incorrectSection) incorrectSection.style.display = 'none';
        if (leaderboardSection) leaderboardSection.style.display = 'none';
    }
    
    // Helper function to find elements by text content
    Element.prototype.querySelector = (function(querySelector) {
        return function(selector) {
            try {
                if (selector.includes(':contains(')) {
                    const match = selector.match(/(.*):contains\("(.*)"\)(.*)/);
                    if (match) {
                        const [_, before, text, after] = match;
                        const elements = this.querySelectorAll(before + after);
                        for (let i = 0; i < elements.length; i++) {
                            if (elements[i].textContent.includes(text)) {
                                return elements[i];
                            }
                        }
                        return null;
                    }
                }
                return querySelector.call(this, selector);
            } catch (e) {
                return querySelector.call(this, selector);
            }
        };
    })(Element.prototype.querySelector);
    
    // Add CSS for diamond hand display
    function addDiamondHandCSS() {
        const style = document.createElement('style');
        style.textContent = `
        .diamond-hand {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 20px 0;
          font-family: monospace;
        }
        
        .hand-middle {
          display: flex;
          justify-content: space-between;
          width: 100%;
          margin: 10px 0;
        }
        
        .north, .south, .west, .east {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          background-color: #f9f9f9;
          min-width: 120px;
        }
        
        .north, .south {
          text-align: center;
        }
        
        .west {
          margin-right: 40px;
        }
        
        .east {
          margin-left: 40px;
        }
        
        .selected {
          background-color: #e0f7fa !important;
          border-color: #4CAF50 !important;
        }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize the quiz
    initQuiz();
});
