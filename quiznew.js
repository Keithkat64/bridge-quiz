document.addEventListener('DOMContentLoaded', function() {
    console.log('Quiz script loaded v2.0.6 - Elementor Form Compatible');
    
    // Quiz state
    let quizData = null;
    let currentQuestion = 0;
    let userScore = 0;
    let userAnswers = [];
    let userInfo = {
        firstName: '',
        lastName: ''
    };
    
    // Find modules by ID
    const modules = {
        registration: document.getElementById('registration'),
        questionbox: document.getElementById('questionbox'),
        correctBox: document.getElementById('correctBox'),
        wrongBox: document.getElementById('wrongBox'),
        leaderboard: document.getElementById('leaderboard')
    };
    
    console.log('Found modules:', modules);
    
    // Find Elementor form
    const elementorForm = document.querySelector('form.elementor-form[name="quizreg"]');
    console.log('Found Elementor form:', elementorForm);
    
    // Find form elements using Elementor's structure
    let firstNameInput, lastNameInput, startQuizButton;
    
    if (elementorForm) {
        // Elementor forms use .elementor-field-group elements
        const fieldGroups = elementorForm.querySelectorAll('.elementor-field-group');
        
        // First field group should contain the first name input
        if (fieldGroups.length > 0) {
            firstNameInput = fieldGroups[0].querySelector('input');
        }
        
        // Second field group should contain the last name input
        if (fieldGroups.length > 1) {
            lastNameInput = fieldGroups[1].querySelector('input');
        }
        
        // The submit button is usually in a .elementor-field-type-submit group
        startQuizButton = elementorForm.querySelector('.elementor-field-type-submit button');
        
        // If we can't find the button that way, try other selectors
        if (!startQuizButton) {
            startQuizButton = elementorForm.querySelector('button[type="submit"]');
        }
    }
    
    console.log('Form elements:', {
        firstNameInput: firstNameInput,
        lastNameInput: lastNameInput,
        startQuizButton: startQuizButton
    });
    
    // Find question elements
    const numberBtn = document.getElementById('numberbtn');
    const southHandBox = document.getElementById('southhandBox');
    const biddingBox = document.getElementById('biddingBox');
    const optionsBox = document.getElementById('optionsBox');
    const seeAnswerButton = document.querySelector('#questionbox button');
    
    // Find answer elements
    const nextQuestionButtonCorrect = document.querySelector('#correctBox button');
    const nextQuestionButtonWrong = document.querySelector('#wrongBox button');
    
    // Find leaderboard elements
    const leaderboardTable = document.querySelector('#leaderboard table');
    const finishQuizButton = document.querySelector('#leaderboard button');
    
    // Get quiz data from hidden input
    const quizDataInput = document.getElementById('quiz-data');
    
    // Initialize the quiz
    function initQuiz() {
        console.log('Initializing quiz...');
        
        // Load quiz data
        if (quizDataInput) {
            quizData = parseQuizData(quizDataInput.value);
            console.log('Quiz data loaded:', quizData);
        } else {
            console.error('Quiz data input not found');
        }
        
        // Hide all modules except registration
        hideAllModules();
        if (modules.registration) {
            modules.registration.style.display = 'block';
        }
        
        // Set up form validation and button visibility
        if (elementorForm && startQuizButton) {
            // Initially hide the button or disable it
            startQuizButton.style.display = 'none';
            
            // Function to check if both inputs have values
            function checkInputs() {
                const firstName = firstNameInput ? firstNameInput.value.trim() : '';
                const lastName = lastNameInput ? lastNameInput.value.trim() : '';
                
                if (firstName !== '' && lastName !== '') {
                    startQuizButton.style.display = 'block';
                } else {
                    startQuizButton.style.display = 'none';
                }
            }
            
            // Add event listeners to inputs if they exist
            if (firstNameInput) {
                firstNameInput.addEventListener('input', checkInputs);
            }
            
            if (lastNameInput) {
                lastNameInput.addEventListener('input', checkInputs);
            }
            
            // Prevent form submission and handle quiz start
            elementorForm.addEventListener('submit', function(e) {
                e.preventDefault(); // Prevent the form from actually submitting
                
                // Start the quiz
                startQuiz();
            });
        }
        
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
        // Save user info from form inputs
        userInfo.firstName = firstNameInput ? firstNameInput.value.trim() : 'Guest';
        userInfo.lastName = lastNameInput ? lastNameInput.value.trim() : '';
        
        console.log('Starting quiz for:', userInfo.firstName, userInfo.lastName);
        
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
        
        // Update question number button
        if (numberBtn) {
            numberBtn.textContent = `Question ${index + 1}`;
            console.log('Updated question number button:', numberBtn.textContent);
        }
        
        // Update South hand with suit symbols in the southhandBox
        if (southHandBox && question.allHands && question.allHands.south) {
            southHandBox.innerHTML = question.allHands.south;
            console.log('Updated South hand box with:', question.allHands.south);
        }
        
        // Update bidding box
        if (biddingBox && question.bidding) {
            let biddingHTML = '<table>';
            question.bidding.forEach(bid => {
                biddingHTML += `<tr><td>${bid}</td></tr>`;
            });
            biddingHTML += '</table>';
            biddingBox.innerHTML = biddingHTML;
            console.log('Updated bidding box');
        }
        
        // Update options box
        if (optionsBox && question.options) {
            let optionsHTML = '';
            
            if (question.options.a) {
                optionsHTML += `<div class="option" data-option="a">option a) ${question.options.a}</div>`;
            }
            
            if (question.options.b) {
                optionsHTML += `<div class="option" data-option="b">option b) ${question.options.b}</div>`;
            }
            
            if (question.options.c) {
                optionsHTML += `<div class="option" data-option="c">option c) ${question.options.c}</div>`;
            }
            
            if (question.options.d) {
                optionsHTML += `<div class="option" data-option="d">option d) ${question.options.d}</div>`;
            }
            
            optionsBox.innerHTML = optionsHTML;
            console.log('Updated options box');
            
            // Add event listeners to the newly created option elements
            const optionElements = optionsBox.querySelectorAll('.option');
            optionElements.forEach(option => {
                option.addEventListener('click', function() {
                    // Remove selected class from all options
                    optionElements.forEach(opt => opt.classList.remove('selected'));
                    
                    // Add selected class to clicked option
                    this.classList.add('selected');
                    
                    // Enable see answer button
                    if (seeAnswerButton) {
                        seeAnswerButton.disabled = false;
                    }
                });
            });
        }
        
        // Disable see answer button until an option is selected
        if (seeAnswerButton) {
            seeAnswerButton.disabled = true;
        }
        
        // Show question box
        if (modules.questionbox) {
            modules.questionbox.style.display = 'block';
        }
    }
    
    // Show answer based on selected option
    function showAnswer() {
        // Get selected option
        const selectedOption = optionsBox ? optionsBox.querySelector('.option.selected') : null;
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
        if (modules.questionbox) {
            modules.questionbox.style.display = 'none';
        }
        
        // Show appropriate answer module
        if (isCorrect) {
            // Show correct answer module
            if (modules.correctBox) {
                // Update solution text
                const solutionTextCorrect = modules.correctBox.querySelector('div');
                if (solutionTextCorrect) {
                    solutionTextCorrect.innerHTML = question.solution;
                }
                
                // Add diamond hand display
                const diamondHandContainer = document.createElement('div');
                diamondHandContainer.innerHTML = formatDiamondHand(question.allHands);
                modules.correctBox.appendChild(diamondHandContainer);
                
                // Show the module
                modules.correctBox.style.display = 'block';
            }
        } else {
            // Show incorrect answer module
            if (modules.wrongBox) {
                // Update solution text
                const solutionTextIncorrect = modules.wrongBox.querySelector('div');
                if (solutionTextIncorrect) {
                    solutionTextIncorrect.innerHTML = question.solution;
                }
                
                // Add diamond hand display
                const diamondHandContainer = document.createElement('div');
                diamondHandContainer.innerHTML = formatDiamondHand(question.allHands);
                modules.wrongBox.appendChild(diamondHandContainer);
                
                // Show the module
                modules.wrongBox.style.display = 'block';
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
        if (modules.correctBox) modules.correctBox.style.display = 'none';
        if (modules.wrongBox) modules.wrongBox.style.display = 'none';
        
        // Remove any diamond hand displays that were added
        if (modules.correctBox) {
            const diamondHand = modules.correctBox.querySelector('.diamond-hand');
            if (diamondHand && diamondHand.parentNode) {
                diamondHand.parentNode.remove();
            }
        }
        
        if (modules.wrongBox) {
            const diamondHand = modules.wrongBox.querySelector('.diamond-hand');
            if (diamondHand && diamondHand.parentNode) {
                diamondHand.parentNode.remove();
            }
        }
        
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
        if (modules.leaderboard) {
            modules.leaderboard.style.display = 'block';
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
        
        // Fill remaining rows if needed
        for (let i = scores.length; i < 10; i++) {
            tableHTML += `
                <tr>
                    <td>${i + 1}</td>
                    <td></td>
                    <td></td>
                </tr>
            `;
        }
        
        // Update table body
        const tableBody = leaderboardTable.querySelector('tbody');
        if (tableBody) {
            tableBody.innerHTML = tableHTML;
        } else {
            leaderboardTable.innerHTML = tableHTML;
        }
    }
    
    // Finish quiz and reset
    function finishQuiz() {
        hideAllModules();
        
        // Clear inputs if they exist
        if (firstNameInput) firstNameInput.value = '';
        if (lastNameInput) lastNameInput.value = '';
        
        // Hide start button again if it exists
        if (startQuizButton) {
            startQuizButton.style.display = 'none';
        }
        
        // Show registration module
        if (modules.registration) {
            modules.registration.style.display = 'block';
        }
    }
    
    // Hide all modules
    function hideAllModules() {
        if (modules.registration) modules.registration.style.display = 'none';
        if (modules.questionbox) modules.questionbox.style.display = 'none';
        if (modules.correctBox) modules.correctBox.style.display = 'none';
        if (modules.wrongBox) modules.wrongBox.style.display = 'none';
        if (modules.leaderboard) modules.leaderboard.style.display = 'none';
    }
    
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
        
        .option {
          display: block;
          margin-bottom: 10px;
          padding: 10px;
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .option:hover {
          background-color: #f0f0f0;
        }
        
        .option.selected {
          background-color: #e0f7fa !important;
          border-color: #4CAF50 !important;
        }
        `;
        document.head.appendChild(style);
    }
    
    // Add the CSS
    addDiamondHandCSS();
    
    // Initialize the quiz
    initQuiz();
});
