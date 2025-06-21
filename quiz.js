document.addEventListener('DOMContentLoaded', function() {
    console.log('Quiz script loaded');
    
    // Quiz state
    let quizData = null;
    let currentQuestion = 0;
    let userScore = 0;
    let userAnswers = [];
    let userInfo = {
        firstName: '',
        lastName: ''
    };
    
    // Find the quiz container
    const quizContainer = document.getElementById('quiz-container');
    
    // Check if quiz container exists
    if (!quizContainer) {
        console.error('Quiz container not found');
        return;
    }
    
    // DOM Elements - Registration
    const quizRegistration = document.querySelector('#quiz-registration');
    const firstNameInput = document.querySelector('#firstName');
    const lastNameInput = document.querySelector('#lastName');
    const startQuizButton = document.querySelector('#start-quiz');
    
    // DOM Elements - Question Box
    const questionBox = document.querySelector('#QuestionBox');
    const questionNumberElement = document.querySelector('#question-number');
    const questionHandElement = document.querySelector('#questionhand');
    const biddingBoxElement = document.querySelector('#Biddingbox');
    const optionAElement = document.querySelector('#option-a');
    const optionBElement = document.querySelector('#option-b');
    const optionCElement = document.querySelector('#option-c');
    const optionDElement = document.querySelector('#option-d'); // In case there's a D option
    const seeAnswerButton = document.querySelector('#see-answer');
    
    // DOM Elements - Answer Modules
    const correctAnswerModule = document.querySelector('#CorrectAnswer');
    const wrongAnswerModule = document.querySelector('#WrongAnswer');
    const solutionTextCorrect = document.querySelector('#SolutionTextCorrect');
    const solutionTextError = document.querySelector('#SolutionTextError');
    const diamondHandCorrect = document.querySelector('#DiamondhandCorrect');
    const diamondHandError = document.querySelector('#DiamondhandError');
    const nextQuestionButtonCorrect = document.querySelector('#next-question-correct');
    const nextQuestionButtonWrong = document.querySelector('#next-question-wrong');
    
    // DOM Elements - Leaderboard
    const leaderboardModule = document.querySelector('#Leaderboard');
    const leaderboardTable = document.querySelector('#leaderboard-table');
    const finishQuizButton = document.querySelector('#finish-quiz');
    
    // Initialize the quiz
    function initQuiz() {
        console.log('Initializing quiz...');
        
        // Hide all modules except registration
        hideAllModules();
        if (quizRegistration) {
            quizRegistration.style.display = 'block';
        }
        
        // Initially hide the start quiz button
        if (startQuizButton) {
            startQuizButton.style.display = 'none';
        }
        
        // Add event listeners to name inputs
        if (firstNameInput && lastNameInput) {
            firstNameInput.addEventListener('input', checkNameInputs);
            lastNameInput.addEventListener('input', checkNameInputs);
        }
        
        // Add event listener to start quiz button
        if (startQuizButton) {
            startQuizButton.addEventListener('click', startQuiz);
        }
        
        // Add event listeners to answer options
        document.querySelectorAll('.quiz-option').forEach(option => {
            option.addEventListener('click', selectOption);
        });
        
        // Add event listener to see answer button
        if (seeAnswerButton) {
            seeAnswerButton.addEventListener('click', showAnswer);
            seeAnswerButton.disabled = true; // Initially disabled
        }
        
        // Add event listeners to next question buttons
        if (nextQuestionButtonCorrect) {
            nextQuestionButtonCorrect.addEventListener('click', nextQuestion);
        }
        if (nextQuestionButtonWrong) {
            nextQuestionButtonWrong.addEventListener('click', nextQuestion);
        }
        
        // Add event listener to finish quiz button
        if (finishQuizButton) {
            finishQuizButton.addEventListener('click', finishQuiz);
        }
        
        // Load quiz data from data attribute
        loadQuizData();
    }
    
    // Check if both first and last name are entered
    function checkNameInputs() {
        if (firstNameInput.value.trim() !== '' && lastNameInput.value.trim() !== '') {
            startQuizButton.style.display = 'block';
        } else {
            startQuizButton.style.display = 'none';
        }
    }
    
    // Parse the text format quiz data
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
        
        console.log('Parsed hands:', hands);
        return hands;
    }
    
    // Load quiz data from data attribute
    function loadQuizData() {
        try {
            // Get the quiz data from the data attribute
            const quizDataElement = document.getElementById('quiz-data');
            
            if (quizDataElement && quizDataElement.getAttribute('value')) {
                const rawData = quizDataElement.getAttribute('value');
                quizData = parseQuizData(rawData);
                console.log('Quiz data loaded successfully');
            } else {
                console.error('Quiz data element or value not found');
            }
        } catch (error) {
            console.error('Error loading quiz data:', error);
        }
    }
    
    // Start the quiz
    function startQuiz() {
        // Save user info
        userInfo.firstName = firstNameInput.value.trim();
        userInfo.lastName = lastNameInput.value.trim();
        
        // Reset quiz state
        currentQuestion = 0;
        userScore = 0;
        userAnswers = [];
        
        // Hide registration and show first question
        hideAllModules();
        showQuestion(currentQuestion);
    }
    
    // Show a specific question
    function showQuestion(index) {
        if (!quizData || !quizData[index]) {
            console.error('Question data not available for index:', index);
            return;
        }
        
        const question = quizData[index];
        
        // Update question number
        if (questionNumberElement) {
            questionNumberElement.textContent = `Question ${index + 1}`;
        }
        
        // Update South hand with suit symbols
        if (questionHandElement && question.allHands && question.allHands.south) {
            questionHandElement.innerHTML = question.allHands.south;
        }
        
        // Update bidding box
        if (biddingBoxElement && question.bidding) {
            biddingBoxElement.innerHTML = question.bidding.join('<br>');
        }
        
        // Update options
        if (optionAElement && question.options && question.options.a) {
            optionAElement.textContent = question.options.a;
            optionAElement.setAttribute('data-option', 'a');
            optionAElement.style.display = 'block';
        }
        
        if (optionBElement && question.options && question.options.b) {
            optionBElement.textContent = question.options.b;
            optionBElement.setAttribute('data-option', 'b');
            optionBElement.style.display = 'block';
        }
        
        if (optionCElement) {
            if (question.options && question.options.c) {
                optionCElement.textContent = question.options.c;
                optionCElement.setAttribute('data-option', 'c');
                optionCElement.style.display = 'block';
            } else {
                optionCElement.style.display = 'none';
            }
        }
        
        if (optionDElement) {
            if (question.options && question.options.d) {
                optionDElement.textContent = question.options.d;
                optionDElement.setAttribute('data-option', 'd');
                optionDElement.style.display = 'block';
            } else {
                optionDElement.style.display = 'none';
            }
        }
        
        // Reset option selection
        document.querySelectorAll('.quiz-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Disable see answer button until an option is selected
        if (seeAnswerButton) {
            seeAnswerButton.disabled = true;
        }
        
        // Show question box
        if (questionBox) {
            questionBox.style.display = 'block';
        }
    }
    
    // Handle option selection
    function selectOption(event) {
        // Remove selected class from all options
        document.querySelectorAll('.quiz-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Add selected class to clicked option
        event.currentTarget.classList.add('selected');
        
        // Enable see answer button
        if (seeAnswerButton) {
            seeAnswerButton.disabled = false;
        }
    }
    
    // Show answer based on selected option
    function showAnswer() {
        // Get selected option
        const selectedOption = document.querySelector('.quiz-option.selected');
        if (!selectedOption) {
            return;
        }
        
        // Get option value (a, b, c, or d)
        const selectedValue = selectedOption.getAttribute('data-option');
        
        // Get current question data
        const question = quizData[currentQuestion];
        
        // Check if answer is correct
        const isCorrect = selectedValue === question.correctAnswer;
        
        // Save user's answer
        userAnswers.push({
            question: currentQuestion,
            answer: selectedValue,
            correct: isCorrect
        });
        
        // Update score if correct
        if (isCorrect) {
            userScore++;
        }
        
        // Hide question box
        if (questionBox) {
            questionBox.style.display = 'none';
        }
        
        // Show appropriate answer module
        if (isCorrect) {
            // Show correct answer module
            if (correctAnswerModule) {
                correctAnswerModule.style.display = 'block';
            }
            
            // Update solution text
            if (solutionTextCorrect) {
                solutionTextCorrect.innerHTML = question.solution;
            }
            
            // Update diamond hand display
            if (diamondHandCorrect) {
                diamondHandCorrect.innerHTML = formatDiamondHand(question.allHands);
            }
        } else {
            // Show wrong answer module
            if (wrongAnswerModule) {
                wrongAnswerModule.style.display = 'block';
            }
            
            // Update solution text
            if (solutionTextError) {
                solutionTextError.innerHTML = question.solution;
            }
            
            // Update diamond hand display
            if (diamondHandError) {
                diamondHandError.innerHTML = formatDiamondHand(question.allHands);
            }
        }
    }
    
    // Format all four hands in diamond pattern
    function formatDiamondHand(hands) {
        if (!hands) return '';
        
        return `
            <div class="diamond-hand">
                <div class="north">${hands.north || ''}</div>
                <div class="hand-middle">
                    <div class="west">${hands.west || ''}</div>
                    <div class="east">${hands.east || ''}</div>
                </div>
                <div class="south">${hands.south || ''}</div>
            </div>
        `;
    }
    
    // Go to next question
    function nextQuestion() {
        // Hide answer modules
        if (correctAnswerModule) correctAnswerModule.style.display = 'none';
        if (wrongAnswerModule) wrongAnswerModule.style.display = 'none';
        
        // Increment question index
        currentQuestion++;
        
        // Check if quiz is complete
        if (currentQuestion >= quizData.length) {
            // Show leaderboard/results
            showLeaderboard();
        } else {
            // Show next question
            showQuestion(currentQuestion);
        }
    }
    
    // Show leaderboard with results
    function showLeaderboard() {
        hideAllModules();
        
        // Update leaderboard with user's score
        const userFullName = `${userInfo.firstName} ${userInfo.lastName}`;
        
        // Save score to local storage
        saveScoreToLocalStorage(userFullName, userScore);
        
        // Display leaderboard
        updateLeaderboardDisplay();
        
        // Show leaderboard module
        if (leaderboardModule) {
            leaderboardModule.style.display = 'block';
        }
    }
    
    // Save score to local storage
    function saveScoreToLocalStorage(name, score) {
        // Get existing scores
        let scores = JSON.parse(localStorage.getItem('quizScores') || '[]');
        
        // Add new score
        scores.push({
            name: name,
            score: score,
            date: new Date().toISOString()
        });
        
        // Sort by score (highest first)
        scores.sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        scores = scores.slice(0, 10);
        
        // Save back to local storage
        localStorage.setItem('quizScores', JSON.stringify(scores));
    }
    
    // Update leaderboard display
    function updateLeaderboardDisplay() {
        if (!leaderboardTable) {
            return;
        }
        
        // Get scores from local storage
        const scores = JSON.parse(localStorage.getItem('quizScores') || '[]');
        
        // Create table rows
        let tableHTML = `
            <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Score</th>
            </tr>
        `;
        
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
        
        // Update table
        leaderboardTable.innerHTML = tableHTML;
    }
    
    // Finish quiz and reset
    function finishQuiz() {
        hideAllModules();
        if (quizRegistration) {
            quizRegistration.style.display = 'block';
        }
        
        // Clear inputs
        if (firstNameInput) firstNameInput.value = '';
        if (lastNameInput) lastNameInput.value = '';
        
        // Hide start button again
        if (startQuizButton) {
            startQuizButton.style.display = 'none';
        }
    }
    
    // Hide all modules
    function hideAllModules() {
        if (quizRegistration) quizRegistration.style.display = 'none';
        if (questionBox) questionBox.style.display = 'none';
        if (correctAnswerModule) correctAnswerModule.style.display = 'none';
        if (wrongAnswerModule) wrongAnswerModule.style.display = 'none';
        if (leaderboardModule) leaderboardModule.style.display = 'none';
    }
    
    // Initialize the quiz when the page loads
    initQuiz();
});
