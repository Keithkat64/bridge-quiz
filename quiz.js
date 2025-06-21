document.addEventListener('DOMContentLoaded', function() {
    console.log('Quiz script loaded v1.0.3');
    
    // Find the Quiz container
    const quizContainer = findContainerByText('Quiz');
    
    if (!quizContainer) {
        console.error('Quiz container not found');
        return;
    }
    
    console.log('Found Quiz container:', quizContainer);
    
    // Find all modules inside the Quiz container
    const quizRegistration = findModuleByText(quizContainer, 'Quiz Registration');
    const questionBox = findModuleByText(quizContainer, 'Question');
    const correctAnswerModule = findModuleByText(quizContainer, 'Correct');
    const wrongAnswerModule = findModuleByText(quizContainer, 'Nearly right');
    const leaderboardModule = findModuleByText(quizContainer, 'Leaderboard');
    
    console.log('Found modules:', {
        quizRegistration,
        questionBox,
        correctAnswerModule,
        wrongAnswerModule,
        leaderboardModule
    });
    
    // Find form elements
    const firstNameInput = quizRegistration.querySelector('input[type="text"]:first-of-type');
    const lastNameInput = quizRegistration.querySelector('input[type="text"]:last-of-type');
    const startQuizButton = quizRegistration.querySelector('button');
    
    // Find question elements
    const questionNumberElement = questionBox.querySelector('h2, h3, h4');
    const questionHandElement = questionBox.querySelector('div:not(:has(button))');
    const biddingBoxElement = questionBox.querySelector('div:not(:has(button)):nth-of-type(2)');
    const optionAElement = questionBox.querySelector('div[id*="option-a"], div:contains("A")');
    const optionBElement = questionBox.querySelector('div[id*="option-b"], div:contains("B")');
    const optionCElement = questionBox.querySelector('div[id*="option-c"], div:contains("C")');
    const seeAnswerButton = questionBox.querySelector('button');
    
    // Find answer elements
    const solutionTextCorrect = correctAnswerModule.querySelector('div:not(:has(button))');
    const diamondHandCorrect = correctAnswerModule.querySelector('div:empty');
    const nextQuestionButtonCorrect = correctAnswerModule.querySelector('button');
    
    const solutionTextError = wrongAnswerModule.querySelector('div:not(:has(button))');
    const diamondHandError = wrongAnswerModule.querySelector('div:empty');
    const nextQuestionButtonWrong = wrongAnswerModule.querySelector('button');
    
    // Find leaderboard elements
    const leaderboardTable = leaderboardModule.querySelector('table');
    const finishQuizButton = leaderboardModule.querySelector('button');
    
    // Get quiz data from hidden input
    const quizDataInput = document.getElementById('quiz-data');
    let quizData = [];
    
    if (quizDataInput) {
        quizData = parseQuizData(quizDataInput.value);
        console.log('Quiz data loaded:', quizData);
    } else {
        console.error('Quiz data input not found');
    }
    
    // Quiz state
    let currentQuestion = 0;
    let userScore = 0;
    let userAnswers = [];
    let userInfo = {
        firstName: '',
        lastName: ''
    };
    
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
        if (optionAElement) optionAElement.addEventListener('click', () => selectOption(optionAElement));
        if (optionBElement) optionBElement.addEventListener('click', () => selectOption(optionBElement));
        if (optionCElement) optionCElement.addEventListener('click', () => selectOption(optionCElement));
        
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
    }
    
    // Helper function to find container by text content
    function findContainerByText(text) {
        const elements = document.querySelectorAll('div, section');
        for (const element of elements) {
            if (element.textContent.includes(text) && !element.querySelector('div, section')) {
                return element.parentElement;
            }
        }
        return null;
    }
    
    // Helper function to find module by text content within container
    function findModuleByText(container, text) {
        const elements = container.querySelectorAll('div, section');
        for (const element of elements) {
            if (element.textContent.includes(text)) {
                return element;
            }
        }
        return null;
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
        
        return hands;
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
        
        // Reset option selection
        if (optionAElement) optionAElement.classList.remove('selected');
        if (optionBElement) optionBElement.classList.remove('selected');
        if (optionCElement) optionCElement.classList.remove('selected');
        
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
    function selectOption(optionElement) {
        // Remove selected class from all options
        if (optionAElement) optionAElement.classList.remove('selected');
        if (optionBElement) optionBElement.classList.remove('selected');
        if (optionCElement) optionCElement.classList.remove('selected');
        
        // Add selected class to clicked option
        optionElement.classList.add('selected');
        
        // Enable see answer button
        if (seeAnswerButton) {
            seeAnswerButton.disabled = false;
        }
    }
    
    // Show answer based on selected option
    function showAnswer() {
        // Get selected option
        const selectedOption = questionBox.querySelector('.selected');
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
    
    // Add CSS for diamond hand display
    const style = document.createElement('style');
    style.textContent = `
    .diamond-hand {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 20px 0;
      font-family: monospace;
      white-space: pre-line;
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
    
    // Initialize the quiz
    initQuiz();
});
