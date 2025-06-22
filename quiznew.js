document.addEventListener('DOMContentLoaded', function() {
    console.log('Quiz script loaded v5.0.0');
    
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
    
    // Find all modules by their IDs
    const registrationModule = document.getElementById('registration');
    const questionboxModule = document.getElementById('questionbox');
    const correctBoxModule = document.getElementById('correctBox');
    const wrongBoxModule = document.getElementById('wrongBox');
    const leaderboardModule = document.getElementById('leaderboard');
    
    console.log('Found modules by ID:', {
        registration: !!registrationModule,
        questionbox: !!questionboxModule,
        correctBox: !!correctBoxModule,
        wrongBox: !!wrongBoxModule,
        leaderboard: !!leaderboardModule
    });
    
    // Find form elements in the registration form
    const registrationForm = document.querySelector('#registration form') || document.querySelector('#quiz-registration-form');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const startQuizButton = document.getElementById('startquizbtn') || document.querySelector('#registration button');
    
    console.log('Found form elements:', {
        form: !!registrationForm,
        firstName: !!firstNameInput,
        lastName: !!lastNameInput,
        startButton: !!startQuizButton
    });
    
    // Find question elements
    const questionNumberField = document.getElementById('numberbtn');
    const southHandBox = document.getElementById('southhandBox');
    const biddingBox = document.getElementById('biddingBox');
    const optionsBox = document.getElementById('optionsBox');
    const optionA = document.querySelector('#option-a') || document.querySelector('.option-btn:nth-child(1)');
    const optionB = document.querySelector('#option-b') || document.querySelector('.option-btn:nth-child(2)');
    const optionC = document.querySelector('#option-c') || document.querySelector('.option-btn:nth-child(3)');
    const seeAnswerButton = document.querySelector('#see-answer') || document.querySelector('#questionbox button');
    
    // Find solution elements
    const correctSolutionDiv = correctBoxModule ? correctBoxModule.querySelector('.solution-text') : null;
    const incorrectSolutionDiv = wrongBoxModule ? wrongBoxModule.querySelector('.solution-text') : null;
    const nextButtonCorrect = correctBoxModule ? correctBoxModule.querySelector('button') : null;
    const nextButtonIncorrect = wrongBoxModule ? wrongBoxModule.querySelector('button') : null;
    
    // Find leaderboard elements
    const leaderboardTable = leaderboardModule ? leaderboardModule.querySelector('table tbody') : null;
    const finishButton = leaderboardModule ? leaderboardModule.querySelector('button') : null;
    
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
        
        // Hide all modules except registration
        hideAllModules();
        if (registrationModule) {
            registrationModule.style.display = 'block';
        }
        
        // Set up form submission
        if (registrationForm) {
            registrationForm.addEventListener('submit', function(e) {
                e.preventDefault();
                startQuiz();
            });
        }
        
        // Set up name input validation
        if (firstNameInput && lastNameInput && startQuizButton) {
            function checkInputs() {
                if (firstNameInput.value.trim() !== '' && lastNameInput.value.trim() !== '') {
                    startQuizButton.disabled = false;
                    startQuizButton.style.display = 'block';
                } else {
                    startQuizButton.disabled = true;
                    startQuizButton.style.display = 'none';
                }
            }
            
            firstNameInput.addEventListener('input', checkInputs);
            lastNameInput.addEventListener('input', checkInputs);
            
            // Initial check
            checkInputs();
        }
        
        // Add event listener to start quiz button if not part of a form
        if (startQuizButton && !registrationForm) {
            startQuizButton.addEventListener('click', startQuiz);
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
        
        // Update question number field
        if (questionNumberField) {
            questionNumberField.textContent = `Question ${index + 1}`;
            console.log('Updated question number field to:', `Question ${index + 1}`);
        }
        
        // Update South hand
        if (southHandBox && question.allHands && question.allHands.south) {
            southHandBox.innerHTML = formatSouthHand(question.allHands.south);
        }
        
        // Update bidding box
        if (biddingBox && question.bidding) {
            biddingBox.innerHTML = formatBidding(question.bidding);
        }
        
        // Update options
        if (optionsBox) {
            optionsBox.innerHTML = formatOptions(question.options);
            
            // Re-add event listeners to the new option elements
            const newOptionA = document.querySelector('#option-a') || document.querySelector('.option-btn:nth-child(1)');
            const newOptionB = document.querySelector('#option-b') || document.querySelector('.option-btn:nth-child(2)');
            const newOptionC = document.querySelector('#option-c') || document.querySelector('.option-btn:nth-child(3)');
            
            if (newOptionA) newOptionA.addEventListener('click', () => selectOption('a', newOptionA));
            if (newOptionB) newOptionB.addEventListener('click', () => selectOption('b', newOptionB));
            if (newOptionC) newOptionC.addEventListener('click', () => selectOption('c', newOptionC));
        } else if (optionA && optionB) {
            // If we don't have optionsBox but have individual options
            if (optionA && question.options && question.options.a) {
                optionA.textContent = `option a) ${question.options.a}`;
                optionA.classList.remove('selected');
                optionA.style.display = 'block';
            }
            
            if (optionB && question.options && question.options.b) {
                optionB.textContent = `option b) ${question.options.b}`;
                optionB.classList.remove('selected');
                optionB.style.display = 'block';
            }
            
            if (optionC) {
                if (question.options && question.options.c) {
                    optionC.textContent = `option c) ${question.options.c}`;
                    optionC.classList.remove('selected');
                    optionC.style.display = 'block';
                } else {
                    optionC.style.display = 'none';
                }
            }
        }
        
        // Reset selected option
        selectedOption = null;
        
        // Disable see answer button
        if (seeAnswerButton) {
            seeAnswerButton.disabled = true;
        }
        
        // Show question module
        if (questionboxModule) {
            questionboxModule.style.display = 'block';
        }
    }
    
    // Format South hand with suit symbols
    function formatSouthHand(handText) {
        if (!handText) return '';
        
        const lines = handText.split('\n');
        let html = 'South holds<br>';
        
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
            } else {
                html += line + '<br>';
            }
        });
        
        return html;
    }
    
    // Format bidding as a table
    function formatBidding(bidding) {
        if (!bidding || bidding.length === 0) return '';
        
        let html = '<table class="bidding-table"><tr><th>West</th><th>North</th><th>East</th><th>South</th></tr>';
        
        // Process each bidding line
        bidding.forEach(line => {
            const bids = line.split('-').map(bid => bid.trim());
            if (bids.length === 4) {
                html += `<tr><td>${bids[0]}</td><td>${bids[1]}</td><td>${bids[2]}</td><td>${bids[3]}</td></tr>`;
            }
        });
        
        html += '</table>';
        return html;
    }
    
    // Format options with letter circles
    function formatOptions(options) {
        if (!options) return '';
        
        let html = '';
        
        if (options.a) {
            html += `
                <div id="option-a" class="option-btn">
                    <span class="option-letter">A</span>
                    <span class="option-text">option a) ${options.a}</span>
                </div>
            `;
        }
        
        if (options.b) {
            html += `
                <div id="option-b" class="option-btn">
                    <span class="option-letter">B</span>
                    <span class="option-text">option b) ${options.b}</span>
                </div>
            `;
        }
        
        if (options.c) {
            html += `
                <div id="option-c" class="option-btn">
                    <span class="option-letter">C</span>
                    <span class="option-text">option c) ${options.c}</span>
                </div>
            `;
        }
        
        return html;
    }
    
    // Select an option
    function selectOption(option, element) {
        // Remove selected class from all options
        const allOptions = document.querySelectorAll('.option-btn');
        allOptions.forEach(opt => opt.classList.remove('selected'));
        
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
        // Get selected option
        const selectedElement = document.querySelector('.option-btn.selected');
        if (!selectedElement) {
            return;
        }
        
        // Get option value from the element
        let selectedValue;
        if (selectedElement.id === 'option-a') {
            selectedValue = 'a';
        } else if (selectedElement.id === 'option-b') {
            selectedValue = 'b';
        } else if (selectedElement.id === 'option-c') {
            selectedValue = 'c';
        } else {
            // Try to get from data attribute
            selectedValue = selectedElement.getAttribute('data-option');
        }
        
        if (!selectedValue) {
            console.error('Could not determine selected option value');
            return;
        }
        
        const question = quizData[currentQuestion];
        const isCorrect = selectedValue === question.correctAnswer;
        
        // Save answer
        userAnswers.push({
            question: currentQuestion,
            answer: selectedValue,
            correct: isCorrect
        });
        
        // Update score
        if (isCorrect) {
            userScore++;
        }
        
        // Hide question module
        if (questionboxModule) {
            questionboxModule.style.display = 'none';
        }
        
        // Show appropriate answer module
        if (isCorrect) {
            // Update solution text
            if (correctSolutionDiv) {
                correctSolutionDiv.innerHTML = question.solution;
            }
            
            // Add diamond hand display
            const diamondHandContainer = document.createElement('div');
            diamondHandContainer.className = 'diamond-display';
            diamondHandContainer.innerHTML = formatDiamondHand(question.allHands);
            
            // Check if there's already a diamond display
            const existingDisplay = correctBoxModule.querySelector('.diamond-display');
            if (existingDisplay) {
                existingDisplay.innerHTML = diamondHandContainer.innerHTML;
            } else {
                // Insert before the button
                const button = correctBoxModule.querySelector('button');
                if (button) {
                    correctBoxModule.insertBefore(diamondHandContainer, button);
                } else {
                    correctBoxModule.appendChild(diamondHandContainer);
                }
            }
            
            // Show correct module
            correctBoxModule.style.display = 'block';
        } else {
            // Update solution text
            if (incorrectSolutionDiv) {
                incorrectSolutionDiv.innerHTML = question.solution;
            }
            
            // Add diamond hand display
            const diamondHandContainer = document.createElement('div');
            diamondHandContainer.className = 'diamond-display';
            diamondHandContainer.innerHTML = formatDiamondHand(question.allHands);
            
            // Check if there's already a diamond display
            const existingDisplay = wrongBoxModule.querySelector('.diamond-display');
            if (existingDisplay) {
                existingDisplay.innerHTML = diamondHandContainer.innerHTML;
            } else {
                // Insert before the button
                const button = wrongBoxModule.querySelector('button');
                if (button) {
                    wrongBoxModule.insertBefore(diamondHandContainer, button);
                } else {
                    wrongBoxModule.appendChild(diamondHandContainer);
                }
            }
            
            // Show incorrect module
            wrongBoxModule.style.display = 'block';
        }
    }
    
    // Format diamond hand
    function formatDiamondHand(hands) {
        if (!hands) return '';
        
        return `
            <div class="diamond-hand">
                <div class="hand-label north-label">North</div>
                <div class="hand-container north">
                    <span class="spades">♠</span> <span class="cards">${formatCards(hands.north.split('\n')[0].split(' ').slice(1).join(' '))}</span><br>
                    <span class="hearts">♥</span> <span class="cards">${formatCards(hands.north.split('\n')[1].split(' ').slice(1).join(' '))}</span><br>
                    <span class="diamonds">♦</span> <span class="cards">${formatCards(hands.north.split('\n')[2].split(' ').slice(1).join(' '))}</span><br>
                    <span class="clubs">♣</span> <span class="cards">${formatCards(hands.north.split('\n')[3].split(' ').slice(1).join(' '))}</span>
                </div>
                <div class="hand-middle">
                    <div class="west-container">
                        <div class="hand-label west-label">West</div>
                        <div class="hand-container west">
                            <span class="spades">♠</span> <span class="cards">${formatCards(hands.west.split('\n')[0].split(' ').slice(1).join(' '))}</span><br>
                            <span class="hearts">♥</span> <span class="cards">${formatCards(hands.west.split('\n')[1].split(' ').slice(1).join(' '))}</span><br>
                            <span class="diamonds">♦</span> <span class="cards">${formatCards(hands.west.split('\n')[2].split(' ').slice(1).join(' '))}</span><br>
                            <span class="clubs">♣</span> <span class="cards">${formatCards(hands.west.split('\n')[3].split(' ').slice(1).join(' '))}</span>
                        </div>
                    </div>
                    <div class="east-container">
                        <div class="hand-label east-label">East</div>
                        <div class="hand-container east">
                            <span class="spades">♠</span> <span class="cards">${formatCards(hands.east.split('\n')[0].split(' ').slice(1).join(' '))}</span><br>
                            <span class="hearts">♥</span> <span class="cards">${formatCards(hands.east.split('\n')[1].split(' ').slice(1).join(' '))}</span><br>
                            <span class="diamonds">♦</span> <span class="cards">${formatCards(hands.east.split('\n')[2].split(' ').slice(1).join(' '))}</span><br>
                            <span class="clubs">♣</span> <span class="cards">${formatCards(hands.east.split('\n')[3].split(' ').slice(1).join(' '))}</span>
                        </div>
                    </div>
                </div>
                <div class="hand-label south-label">South</div>
                <div class="hand-container south">
                    <span class="spades">♠</span> <span class="cards">${formatCards(hands.south.split('\n')[0].split(' ').slice(1).join(' '))}</span><br>
                    <span class="hearts">♥</span> <span class="cards">${formatCards(hands.south.split('\n')[1].split(' ').slice(1).join(' '))}</span><br>
                    <span class="diamonds">♦</span> <span class="cards">${formatCards(hands.south.split('\n')[2].split(' ').slice(1).join(' '))}</span><br>
                    <span class="clubs">♣</span> <span class="cards">${formatCards(hands.south.split('\n')[3].split(' ').slice(1).join(' '))}</span>
                </div>
            </div>
        `;
    }
    
    // Format cards with spacing
    function formatCards(cards) {
        if (!cards) return '';
        return cards.split('').join(' ');
    }
    
    // Go to next question
    function nextQuestion() {
        // Hide answer modules
        if (correctBoxModule) correctBoxModule.style.display = 'none';
        if (wrongBoxModule) wrongBoxModule.style.display = 'none';
        
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
        hideAllModules();
        
        // Save score
        const userFullName = `${userInfo.firstName} ${userInfo.lastName}`;
        saveScoreToLocalStorage(userFullName, userScore);
        
        // Update leaderboard display
        updateLeaderboardDisplay();
        
        // Show leaderboard module
        if (leaderboardModule) {
            leaderboardModule.style.display = 'block';
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
            const rowClass = index % 2 === 0 ? '' : 'alternate-row';
            tableHTML += `
                <tr class="${rowClass} filled-row">
                    <td>${index + 1}</td>
                    <td>${score.name}</td>
                    <td>${score.score}</td>
                </tr>
            `;
        });
        
        // Fill remaining rows
        for (let i = scores.length; i < 10; i++) {
            const rowClass = i % 2 === 0 ? '' : 'alternate-row';
            tableHTML += `
                <tr class="${rowClass}">
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
        hideAllModules();
        
        // Clear inputs
        if (firstNameInput) firstNameInput.value = '';
        if (lastNameInput) lastNameInput.value = '';
        
        // Hide start button again
        if (startQuizButton) {
            startQuizButton.disabled = true;
            startQuizButton.style.display = 'none';
        }
        
        // Show registration module
        if (registrationModule) {
            registrationModule.style.display = 'block';
        }
    }
    
    // Hide all modules
    function hideAllModules() {
        if (registrationModule) registrationModule.style.display = 'none';
        if (questionboxModule) questionboxModule.style.display = 'none';
        if (correctBoxModule) correctBoxModule.style.display = 'none';
        if (wrongBoxModule) wrongBoxModule.style.display = 'none';
        if (leaderboardModule) leaderboardModule.style.display = 'none';
    }
    
    // Add CSS for styling
    function addQuizCSS() {
        const style = document.createElement('style');
        style.textContent = `
        .hand-label {
          font-family: 'Open Sans', sans-serif;
          font-size: 20px;
          font-weight: 800;
          padding-bottom: 2px;
          text-align: center;
          margin-bottom: 0;
        }
        
        .hand-container {
          min-width: 180px;
          padding: 8px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 5px;
          background-color: #f9f9f9;
          line-height: 1.2;
        }
        
        .hand-middle {
          display: flex;
          justify-content: space-between;
          width: 100%;
          margin: 10px 0;
          gap: 40px;
        }
        
        .west-container, .east-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .spades, .clubs {
          color: black;
        }
        
        .hearts, .diamonds {
          color: red;
        }
        
        .cards {
          letter-spacing: 2px;
        }
        
        .option-btn {
          display: flex;
          align-items: center;
          background-color: #f5f5f0;
          border: 1px solid #e0e0d5;
          border-radius: 8px;
          padding: 12px 15px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 10px;
        }
        
        .option-btn:hover {
          background-color: #f0f0e8;
          border-color: #d0d0c8;
        }
        
        .option-btn.selected {
          background-color: #e0f7fa;
          border-color: #4CAF50;
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
        }
        
        .diamond-hand {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Open Sans', sans-serif;
          font-size: 16px;
        }
        `;
        document.head.appendChild(style);
    }
    
    // Add CSS
    addQuizCSS();
    
    // Initialize the quiz
    initQuiz();
});
