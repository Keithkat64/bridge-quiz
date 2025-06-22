document.addEventListener('DOMContentLoaded', function() {
    console.log('Quiz script loaded v9.1.0 - Elementor Form Fix');

    // Quiz state
    let quizData = null;
    let currentQuestion = 0;
    let userScore = 0;
    let userAnswers = [];
    let userInfo = {
        firstName: '',
        lastName: ''
    };
    let selectedOption = null; // Stores the selected option (e.g., 'a', 'b', 'c')

    // --- Module Element References ---
    // Find modules by their unique heading text. This is more reliable for Elementor.
    const registrationModule = findModuleByHeadingText('Quiz registration');
    const questionboxModule = findModuleByHeadingText('Question 1'); // Initial heading for question module
    const correctBoxModule = findModuleByHeadingText('✅Correct');
    const wrongBoxModule = findModuleByHeadingText('❌Incorrect');
    const leaderboardModule = findModuleByHeadingText('🏆 Leaderboard');

    console.log('Found modules:', {
        registration: !!registrationModule,
        questionbox: !!questionboxModule,
        correctBox: !!correctBoxModule,
        wrongBox: !!wrongBoxModule,
        leaderboard: !!leaderboardModule
    });

    // --- Registration Module Elements ---
    const registrationForm = registrationModule ? registrationModule.querySelector('form') : null;
    // Elementor form inputs often have name="form_field_name" and name="form_field_name_0"
    const firstNameInput = registrationForm ? registrationForm.querySelector('input[name="form_field_name"]') : null;
    const lastNameInput = registrationForm ? registrationForm.querySelector('input[name="form_field_name_0"]') : null;
    const startQuizButton = document.getElementById('startquizbtn') || (registrationForm ? registrationForm.querySelector('button[type="submit"]') : null);

    console.log('Registration elements (refined selectors):', {
        form: !!registrationForm,
        firstName: firstNameInput ? firstNameInput.outerHTML : 'Not Found',
        lastName: lastNameInput ? lastNameInput.outerHTML : 'Not Found',
        startButton: startQuizButton ? startQuizButton.outerHTML : 'Not Found'
    });

    // --- Question Box Module Elements ---
    const questionNumberField = questionboxModule ? questionboxModule.querySelector('h1, h2, h3, h4, h5, h6') : null; // The actual heading element
    const southHandBox = questionboxModule ? questionboxModule.querySelector('div:nth-of-type(2)') : null; // Div containing "South holds"
    const biddingBox = questionboxModule ? questionboxModule.querySelector('div:nth-of-type(3)') : null; // Div containing bidding table
    const optionsBox = questionboxModule ? questionboxModule.querySelector('div:nth-of-type(4)') : null; // Div containing options A, B, C
    const optionA = optionsBox ? optionsBox.querySelector('.option-btn:nth-child(1)') : null;
    const optionB = optionsBox ? optionsBox.querySelector('.option-btn:nth-child(2)') : null;
    const optionC = optionsBox ? optionsBox.querySelector('.option-btn:nth-child(3)') : null;
    const seeAnswerButton = questionboxModule ? questionboxModule.querySelector('button') : null;

    console.log('Question elements:', {
        questionNumberField: !!questionNumberField,
        southHandBox: !!southHandBox,
        biddingBox: !!biddingBox,
        optionsBox: !!optionsBox,
        optionA: !!optionA,
        optionB: !!optionB,
        optionC: !!optionC,
        seeAnswerButton: !!seeAnswerButton
    });

    // --- Correct/Incorrect Box Module Elements ---
    const correctSolutionDiv = correctBoxModule ? correctBoxModule.querySelector('.solution-text') : null;
    const incorrectSolutionDiv = wrongBoxModule ? wrongBoxModule.querySelector('.solution-text') : null;
    const nextButtonCorrect = correctBoxModule ? correctBoxModule.querySelector('button') : null;
    const nextButtonIncorrect = wrongBoxModule ? wrongBoxModule.querySelector('button') : null;

    // --- Leaderboard Module Elements ---
    const leaderboardTableBody = leaderboardModule ? leaderboardModule.querySelector('table tbody') : null; // Target tbody for dynamic updates
    const finishButton = leaderboardModule ? leaderboardModule.querySelector('button') : null;

    // Get quiz data from hidden input
    const quizDataInput = document.getElementById('quiz-data');

    // --- Helper Functions ---

    // Finds the main container (section or div) for a module based on its heading text
    function findModuleByHeadingText(headingText) {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        for (const heading of headings) {
            if (heading.textContent.includes(headingText)) {
                // Return the closest section or div that acts as the module container
                return heading.closest('section') || heading.closest('div');
            }
        }
        return null;
    }

    // Parses the raw quiz data from the hidden input field
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

            // Extract question
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
            hands.push(hand);
        });
        return hands;
    }

    // Formats the South hand with suit symbols and line breaks
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

    // Formats bidding as a table
    function formatBidding(bidding) {
        if (!bidding || bidding.length === 0) return '';
        let html = '<table class="bidding-table"><tr><th>West</th><th>North</th><th>East</th><th>South</th></tr>';
        bidding.forEach(line => {
            const bids = line.split('-').map(bid => bid.trim());
            if (bids.length === 4) {
                html += `<tr><td>${bids[0]}</td><td>${bids[1]}</td><td>${bids[2]}</td><td>${bids[3]}</td></tr>`;
            }
        });
        html += '</table>';
        return html;
    }

    // Formats options with letter circles
    function formatOptions(options) {
        if (!options) return '';
        let html = '';
        if (options.a) {
            html += `<div id="option-a" class="option-btn" data-option="a"><span class="option-letter">A</span><span class="option-text">option a) ${options.a}</span></div>`;
        }
        if (options.b) {
            html += `<div id="option-b" class="option-btn" data-option="b"><span class="option-letter">B</span><span class="option-text">option b) ${options.b}</span></div>`;
        }
        if (options.c) {
            html += `<div id="option-c" class="option-btn" data-option="c"><span class="option-letter">C</span><span class="option-text">option c) ${options.c}</span></div>`;
        }
        if (options.d) { // Added support for option D
            html += `<div id="option-d" class="option-btn" data-option="d"><span class="option-letter">D</span><span class="option-text">option d) ${options.d}</span></div>`;
        }
        return html;
    }

    // Formats all four hands in diamond pattern
    function formatDiamondHand(hands) {
        if (!hands) return '';
        const formatCardsForDisplay = (cardsText) => {
            if (!cardsText) return '';
            const parts = cardsText.split(' ');
            if (parts.length >= 2) {
                return parts.slice(1).join(' ').split('').join(' '); // Get cards, then add spacing
            }
            return '';
        };

        return `
            <div class="diamond-hand">
                <div class="hand-label north-label">North</div>
                <div class="hand-container north">
                    <span class="spades">♠</span> <span class="cards">${formatCardsForDisplay(hands.north.split('\n')[0])}</span><br>
                    <span class="hearts">♥</span> <span class="cards">${formatCardsForDisplay(hands.north.split('\n')[1])}</span><br>
                    <span class="diamonds">♦</span> <span class="cards">${formatCardsForDisplay(hands.north.split('\n')[2])}</span><br>
                    <span class="clubs">♣</span> <span class="cards">${formatCardsForDisplay(hands.north.split('\n')[3])}</span>
                </div>
                <div class="hand-middle">
                    <div class="west-container">
                        <div class="hand-label west-label">West</div>
                        <div class="hand-container west">
                            <span class="spades">♠</span> <span class="cards">${formatCardsForDisplay(hands.west.split('\n')[0])}</span><br>
                            <span class="hearts">♥</span> <span class="cards">${formatCardsForDisplay(hands.west.split('\n')[1])}</span><br>
                            <span class="diamonds">♦</span> <span class="cards">${formatCardsForDisplay(hands.west.split('\n')[2])}</span><br>
                            <span class="clubs">♣</span> <span class="cards">${formatCardsForDisplay(hands.west.split('\n')[3])}</span>
                        </div>
                    </div>
                    <div class="east-container">
                        <div class="hand-label east-label">East</div>
                        <div class="hand-container east">
                            <span class="spades">♠</span> <span class="cards">${formatCardsForDisplay(hands.east.split('\n')[0])}</span><br>
                            <span class="hearts">♥</span> <span class="cards">${formatCardsForDisplay(hands.east.split('\n')[1])}</span><br>
                            <span class="diamonds">♦</span> <span class="cards">${formatCardsForDisplay(hands.east.split('\n')[2])}</span><br>
                            <span class="clubs">♣</span> <span class="cards">${formatCardsForDisplay(hands.east.split('\n')[3])}</span>
                        </div>
                    </div>
                </div>
                <div class="hand-label south-label">South</div>
                <div class="hand-container south">
                    <span class="spades">♠</span> <span class="cards">${formatCardsForDisplay(hands.south.split('\n')[0])}</span><br>
                    <span class="hearts">♥</span> <span class="cards">${formatCardsForDisplay(hands.south.split('\n')[1])}</span><br>
                    <span class="diamonds">♦</span> <span class="cards">${formatCardsForDisplay(hands.south.split('\n')[2])}</span><br>
                    <span class="clubs">♣</span> <span class="cards">${formatCardsForDisplay(hands.south.split('\n')[3])}</span>
                </div>
            </div>
        `;
    }

    // --- Core Quiz Logic Functions ---

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

        // Hide all modules except registration initially
        hideAllModules();
        if (registrationModule) {
            registrationModule.style.display = 'block';
        }

        // Set up form validation and button visibility
        if (firstNameInput && lastNameInput && startQuizButton) {
            startQuizButton.style.display = 'none'; // Ensure hidden initially

            function checkInputs() {
                if (firstNameInput.value.trim() !== '' && lastNameInput.value.trim() !== '') {
                    startQuizButton.style.display = 'block';
                } else {
                    startQuizButton.style.display = 'none';
                }
            }
            firstNameInput.addEventListener('input', checkInputs);
            lastNameInput.addEventListener('input', checkInputs);
            checkInputs(); // Initial check on load
        }

        // Set up form submission (for Elementor form)
        if (registrationForm) {
            registrationForm.addEventListener('submit', function(e) {
                e.preventDefault(); // Prevent default form submission
                startQuiz();
            });
        } else if (startQuizButton) { // Fallback if not part of a form
            startQuizButton.addEventListener('click', startQuiz);
        }

        // Add event listeners for options (will be re-attached in showQuestion)
        // and other buttons
        if (seeAnswerButton) seeAnswerButton.addEventListener('click', showAnswer);
        if (nextButtonCorrect) nextButtonCorrect.addEventListener('click', nextQuestion);
        if (nextButtonIncorrect) nextButtonIncorrect.addEventListener('click', nextQuestion);
        if (finishButton) finishButton.addEventListener('click', finishQuiz);

        // Add dynamic CSS for styling
        addDynamicCSS();
    }

    function startQuiz() {
        userInfo.firstName = firstNameInput ? firstNameInput.value.trim() : 'Guest';
        userInfo.lastName = lastNameInput ? lastNameInput.value.trim() : '';
        console.log('Starting quiz for:', userInfo.firstName, userInfo.lastName);

        currentQuestion = 0;
        userScore = 0;
        userAnswers = [];

        hideAllModules();
        showQuestion(currentQuestion);
    }

    function showQuestion(index) {
        if (!quizData || !quizData[index]) {
            console.error('Question data not available for index:', index);
            return;
        }
        const question = quizData[index];

        if (questionNumberField) questionNumberField.textContent = `Question ${index + 1}`;
        if (southHandBox && question.allHands && question.allHands.south) southHandBox.innerHTML = formatSouthHand(question.allHands.south);
        if (biddingBox && question.bidding) biddingBox.innerHTML = formatBidding(question.bidding);

        // Update options and re-attach listeners
        if (optionsBox && question.options) {
            optionsBox.innerHTML = formatOptions(question.options);
            const allOptionButtons = optionsBox.querySelectorAll('.option-btn');
            allOptionButtons.forEach(btn => {
                btn.addEventListener('click', () => selectOption(btn.dataset.option, btn));
            });
        }

        selectedOption = null; // Reset selection
        if (seeAnswerButton) seeAnswerButton.disabled = true; // Disable button

        if (questionboxModule) questionboxModule.style.display = 'block';
    }

    function selectOption(optionValue, element) {
        const allOptionButtons = optionsBox.querySelectorAll('.option-btn');
        allOptionButtons.forEach(btn => btn.classList.remove('selected'));
        element.classList.add('selected');
        selectedOption = optionValue;
        if (seeAnswerButton) seeAnswerButton.disabled = false;
    }

    function showAnswer() {
        if (!selectedOption) return;

        const question = quizData[currentQuestion];
        const isCorrect = selectedOption === question.correctAnswer;

        userAnswers.push({ question: currentQuestion, answer: selectedOption, correct: isCorrect });
        if (isCorrect) userScore++;

        if (questionboxModule) questionboxModule.style.display = 'none';

        const diamondHtml = formatDiamondHand(question.allHands);

        if (isCorrect) {
            if (correctSolutionDiv) correctSolutionDiv.innerHTML = question.solution;
            updateDiamondDisplay(correctBoxModule, diamondHtml);
            if (correctBoxModule) correctBoxModule.style.display = 'block';
        } else {
            if (incorrectSolutionDiv) incorrectSolutionDiv.innerHTML = question.solution;
            updateDiamondDisplay(wrongBoxModule, diamondHtml);
            if (wrongBoxModule) wrongBoxModule.style.display = 'block';
        }
    }

    // Helper to update or create diamond display within solution boxes
    function updateDiamondDisplay(module, htmlContent) {
        let diamondContainer = module.querySelector('.diamond-display-wrapper');
        if (!diamondContainer) {
            diamondContainer = document.createElement('div');
            diamondContainer.className = 'diamond-display-wrapper';
            // Insert before the next question button
            const nextBtn = module.querySelector('button');
            if (nextBtn) {
                module.insertBefore(diamondContainer, nextBtn);
            } else {
                module.appendChild(diamondContainer);
            }
        }
        diamondContainer.innerHTML = htmlContent;
    }


    function nextQuestion() {
        if (correctBoxModule) correctBoxModule.style.display = 'none';
        if (wrongBoxModule) wrongBoxModule.style.display = 'none';

        // Remove dynamically added diamond displays
        document.querySelectorAll('.diamond-display-wrapper').forEach(el => el.remove());

        currentQuestion++;
        if (currentQuestion >= quizData.length) {
            showLeaderboard();
        } else {
            showQuestion(currentQuestion);
        }
    }

    function showLeaderboard() {
        hideAllModules();
        const userFullName = `${userInfo.firstName} ${userInfo.lastName}`;
        saveScoreToLocalStorage(userFullName, userScore);
        updateLeaderboardDisplay();
        if (leaderboardModule) leaderboardModule.style.display = 'block';
    }

    function saveScoreToLocalStorage(name, score) {
        let scores = JSON.parse(localStorage.getItem('quizScores') || '[]');
        scores.push({ name: name, score: score, date: new Date().toISOString() });
        scores.sort((a, b) => b.score - a.score);
        scores = scores.slice(0, 10);
        localStorage.setItem('quizScores', JSON.stringify(scores));
    }

    function updateLeaderboardDisplay() {
        if (!leaderboardTableBody) return;
        const scores = JSON.parse(localStorage.getItem('quizScores') || '[]');
        let tableHTML = '';
        scores.forEach((score, index) => {
            const rowClass = index % 2 === 0 ? '' : 'alternate-row';
            tableHTML += `<tr class="${rowClass} filled-row"><td>${index + 1}</td><td>${score.name}</td><td>${score.score}</td></tr>`;
        });
        for (let i = scores.length; i < 10; i++) {
            const rowClass = i % 2 === 0 ? '' : 'alternate-row';
            tableHTML += `<tr class="${rowClass}"><td>${i + 1}</td><td></td><td></td></tr>`;
        }
        leaderboardTableBody.innerHTML = tableHTML;
    }

    function finishQuiz() {
        hideAllModules();
        if (firstNameInput) firstNameInput.value = '';
        if (lastNameInput) lastNameInput.value = '';
        if (startQuizButton) startQuizButton.style.display = 'none'; // Hide button again
        if (registrationModule) registrationModule.style.display = 'block';
    }

    function hideAllModules() {
        if (registrationModule) registrationModule.style.display = 'none';
        if (questionboxModule) questionboxModule.style.display = 'none';
        if (correctBoxModule) correctBoxModule.style.display = 'none';
        if (wrongBoxModule) wrongBoxModule.style.display = 'none';
        if (leaderboardModule) leaderboardModule.style.display = 'none';
    }

    // --- Dynamic CSS Injection ---
    function addDynamicCSS() {
        const style = document.createElement('style');
        style.textContent = `
        /* General Module Styling */
        .quiz-module {
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            padding: 30px;
            margin-bottom: 30px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        .quiz-module-inner {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        /* Registration Form Specifics */
        .elementor-form-container { /* Assuming this is the wrapper for your form */
            /* Inherits from .quiz-module if it's the main container */
        }
        .elementor-field-group {
            margin-bottom: 20px;
        }
        .elementor-field-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #333;
        }
        .elementor-field { /* For input fields */
            width: 100%;
            padding: 12px 15px;
            border: 1px solid #d5d5d5;
            border-radius: 5px;
            font-size: 15px;
            color: #333;
            transition: all 0.3s;
        }
        .elementor-field:focus {
            border-color: #5bc0de;
            box-shadow: 0 0 0 2px rgba(91, 192, 222, 0.25);
            outline: none;
        }
        .elementor-button { /* For the Start Quiz button */
            background-color: #4CAF50;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            text-align: center;
            transition: all 0.3s;
            width: 100%;
        }
        .elementor-button:hover {
            background-color: #45a049;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        }
        .elementor-button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }
        .elementor-button-text {
            display: inline-block;
        }

        /* Question Box Specifics */
        .question-number-field {
            background-color: #FF6F1F;
            color: white;
            border-radius: 12px;
            padding: 10px 15px;
            padding-left: 5px;
            font-weight: 600;
            font-size: 18px;
            text-align: left;
            width: fit-content;
            margin-bottom: 10px;
        }
        .hand-box {
            background-color: #f9f9f9;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            padding: 15px;
            font-family: monospace;
            white-space: pre-line;
            text-align: center;
            font-size: 16px;
            line-height: 1.5;
        }
        .bidding-box {
            padding: 15px 0;
        }
        .bidding-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #4CA6A8;
            font-family: 'Open Sans', sans-serif;
            font-size: 16px;
            font-weight: 700;
        }
        .bidding-table th, .bidding-table td {
            border: 1px solid #4CA6A8;
            text-align: center;
            padding: 8px;
        }
        .bidding-table th {
            background-color: #f9f9f9;
        }
        .options-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .option-btn {
            background-color: #f5f5f0;
            border: 1px solid #e0e0d5;
            border-radius: 8px;
            padding: 12px 15px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
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
        .see-answer-btn {
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            padding: 12px 20px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            transition: all 0.3s;
            margin-top: 10px;
            align-self: center;
        }
        .see-answer-btn:hover:not(:disabled) {
            background-color: #45a049;
        }
        .see-answer-btn:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }

        /* Solution Box Specifics */
        .solution-box {
            border: 2px solid; /* Border color set by .correct-solution or .incorrect-solution */
            border-radius: 12px;
            padding: 15px;
            background-color: #ffffff;
        }
        .correct-solution {
            border-color: #4CAF50;
        }
        .incorrect-solution {
            border-color: #FF0000;
        }
        .solution-header {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        .solution-icon { /* For correct tick */
            color: #4CAF50;
            font-size: 24px;
            font-weight: bold;
            margin-right: 10px;
        }
        .solution-icon-wrong { /* For incorrect X */
            color: #FF0000;
            font-size: 24px;
            font-weight: bold;
            margin-right: 10px;
        }
        .solution-title { /* For correct text */
            color: #4CAF50;
            font-size: 16px;
            font-weight: bold;
        }
        .solution-title-wrong { /* For incorrect text */
            color: #FF0000;
            font-size: 16px;
            font-weight: bold;
        }
        .solution-text {
            color: #000000;
            font-size: 16px;
            line-height: 1.5;
        }

        /* Diamond Hand Display Specifics */
        .diamond-display-wrapper { /* Wrapper for dynamically added diamond hands */
            border: 1px solid #ffffff; /* Matches the white background */
            border-radius: 12px;
            padding: 15px;
            background-color: #ffffff;
            margin-top: 20px; /* Space between solution text and diamond hand */
        }
        .diamond-hand {
            display: flex;
            flex-direction: column;
            align-items: center;
            font-family: 'Open Sans', sans-serif;
            font-size: 16px;
        }
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

        /* Next Question Button */
.next-question-btn {
    background-color: #4CA6A8;
    color: white;
    border: 1px solid #4CA6A8;
    border-radius: 12px;
    padding: 2px 10px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    transition: all 0.3s;
    align-self: center;
    margin-top: 10px;
}

.next-question-btn:hover {
    background-color: #3d8587;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Leaderboard Specifics */
.leaderboard-header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 15px;
}

.trophy-icon {
    font-size: 24px;
    margin-right: 10px;
    color: #FFD700;
}

.leaderboard-header h2 {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
    color: #333;
}

.leaderboard-table {
    width: 100%;
    border-collapse: collapse;
    border-radius: 5px;
    overflow: hidden;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.05);
}

.leaderboard-table thead tr {
    background-color: #4CA6A8;
    color: white;
    font-weight: 600;
}

.leaderboard-table th,
.leaderboard-table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
}

.leaderboard-table tbody tr:last-child td {
    border-bottom: none;
}

.leaderboard-table tbody tr.alternate-row {
    background-color: #f0f7fa;
}

.leaderboard-table tbody tr.filled-row {
    font-weight: 500;
}

.finish-quiz-btn {
    background-color: #4CA6A8;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 10px 20px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    transition: all 0.3s;
    align-self: center;
    margin-top: 10px;
}

.finish-quiz-btn:hover {
    background-color: #3d8587;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Responsive adjustments */
@media (max-width: 767px) {
    .hand-middle {
        flex-direction: column;
        gap: 20px;
    }
    
    .west-container, .east-container {
        width: 100%;
    }
    
    .hand-container {
        width: 100%;
        min-width: unset;
    }
    
    .west, .east {
        margin: 0;
    }
    
    .leaderboard-table th,
    .leaderboard-table td {
        padding: 8px 10px;
        font-size: 14px;
    }
}  /* Make sure this curly brace is here */
`;
document.head.insertAdjacentHTML('beforeend', `<style>${style}</style>`);

initQuiz();
