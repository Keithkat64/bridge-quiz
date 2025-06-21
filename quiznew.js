document.addEventListener('DOMContentLoaded', function() {
    console.log('Quiz script loaded v2.0.2');
    
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
    
    // Check if modules exist
    if (!modules.registration) {
        console.error('Registration module not found');
        return;
    }
    
    // Find form elements
    const firstNameInput = modules.registration.querySelector('input[type="text"]:nth-of-type(1)');
    const lastNameInput = modules.registration.querySelector('input[type="text"]:nth-of-type(2)');
    const startQuizButton = modules.registration.querySelector('button');
    
    if (!firstNameInput || !lastNameInput || !startQuizButton) {
        console.error('Registration form elements not found');
        console.log('firstNameInput:', firstNameInput);
        console.log('lastNameInput:', lastNameInput);
        console.log('startQuizButton:', startQuizButton);
        return;
    }
    
    // Find question elements if questionbox exists
    let questionNumberElement, questionHandElement, biddingBoxElement, 
        optionAElement, optionBElement, optionCElement, seeAnswerButton;
    
    if (modules.questionbox) {
        questionNumberElement = modules.questionbox.querySelector('h2, h3, h4, h5, h6');
        questionHandElement = modules.questionbox.querySelector('div:contains("South holds")');
        biddingBoxElement = modules.questionbox.querySelector('div:contains("West")');
        optionAElement = modules.questionbox.querySelector('div:contains("option a")');
        optionBElement = modules.questionbox.querySelector('div:contains("option b")');
        optionCElement = modules.questionbox.querySelector('div:contains("option c")');
        seeAnswerButton = modules.questionbox.querySelector('button');
    }
    
    // Find answer elements if answer modules exist
    let solutionTextCorrect, nextQuestionButtonCorrect, 
        solutionTextIncorrect, nextQuestionButtonIncorrect;
    
    if (modules.correctBox) {
        solutionTextCorrect = modules.correctBox.querySelector('div:contains("solution")');
        nextQuestionButtonCorrect = modules.correctBox.querySelector('button');
    }
    
    if (modules.wrongBox) {
        solutionTextIncorrect = modules.wrongBox.querySelector('div:contains("solution")');
        nextQuestionButtonIncorrect = modules.wrongBox.querySelector('button');
    }
    
    // Find leaderboard elements if leaderboard exists
    let leaderboardTable, finishQuizButton;
    
    if (modules.leaderboard) {
        leaderboardTable = modules.leaderboard.querySelector('table');
        finishQuizButton = modules.leaderboard.querySelector('button');
    }
    
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
        
        // Add event listener to start quiz button
        if (startQuizButton) {
            startQuizButton.addEventListener('click', startQuiz);
        }
        
        // Add event listeners to answer options
        if (optionAElement) optionAElement.addEventListener('click', () => selectOption(optionAElement, 'a'));
        if (optionBElement) optionBElement.addEventListener('click', () => selectOption(optionBElement, 'b'));
        if (optionCElement) optionCElement.addEventListener('click', () => selectOption(optionCElement, 'c'));
        
        // Add event listener to see answer button
        if (seeAnswerButton) {
            seeAnswerButton.addEventListener('click', showAnswer);
            seeAnswerButton.disabled = true; // Initially disabled
        }
        
        // Add event listeners to next question buttons
        if (nextQuestionButtonCorrect) {
            nextQuestionButtonCorrect.addEventListener('click', nextQuestion);
        }
        if (nextQuestionButtonIncorrect) {
            nextQuestionButtonIncorrect.addEventListener('click', nextQuestion);
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
            questionHandElement.innerHTML = `South holds\n${question.allHands.south}`;
        }
        
        // Update bidding box
        if (biddingBoxElement && question.bidding) {
            biddingBoxElement.innerHTML = question.bidding.join('<br>');
        }
        
        // Update options
        if (optionAElement && question.options && question.options.a) {
            optionAElement.textContent = `option a) ${question.options.a}`;
            optionAElement.setAttribute('data-option', 'a');
            optionAElement.style.display = 'block';
            optionAElement.classList.remove('selected');
        }
        
        if (optionBElement && question.options && question.options.b) {
            optionBElement.textContent = `option b) ${question.options.b}`;
            optionBElement.setAttribute('data-option', 'b');
            optionBElement.style.display = 'block';
            optionBElement.classList.remove('selected');
        }
        
        if (optionCElement) {
            if (question.options && question.options.c) {
                optionCElement.textContent = `option c) ${question.options.c}`;
                optionCElement.setAttribute('data-option', 'c');
                optionCElement.style.display = 'block';
                optionCElement.classList.remove('selected');
            } else {
                optionCElement.style.display = 'none';
            }
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
    
    // Handle option selection
    function selectOption(optionElement, optionValue) {
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
        const selectedOption = modules.questionbox.querySelector('.selected');
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
                modules.correctBox.style.display = 'block';
            }
            
            // Update solution text
            if (solutionTextCorrect) {
                solutionTextCorrect.innerHTML = question.solution;
            }
            
            // Add diamond hand display
            const diamondHandContainer = modules.correctBox.querySelector('div:empty') || 
                document.createElement('div');
            
            if (diamondHandContainer) {
                diamondHandContainer.innerHTML = formatDiamondHand(question.allHands);
                if (!diamondHandContainer.parentNode) {
                    modules.correctBox.appendChild(diamondHandContainer);
                }
            }
        } else {
            // Show incorrect answer module
            if (modules.wrongBox) {
                modules.wrongBox.style.display = 'block';
            }
            
            // Update solution text
            if (solutionTextIncorrect) {
                solutionTextIncorrect.innerHTML = question.solution;
            }
            
            // Add diamond hand display
            const diamondHandContainer = modules.wrongBox.querySelector('div:empty') || 
                document.createElement('div');
            
            if (diamondHandContainer) {
                diamondHandContainer.innerHTML = formatDiamondHand(question.allHands);
                if (!diamondHandContainer.parentNode) {
                    modules.wrongBox.appendChild(diamondHandContainer);
                }
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
        
        // Clear inputs
        if (firstNameInput) firstNameInput.value = '';
        if (lastNameInput) lastNameInput.value = '';
        
        // Hide start button again
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
    
    // Initialize the quiz
    initQuiz();
});
