document.addEventListener('DOMContentLoaded', function() {
    console.log('Quiz script v7.0.0 - Simplified');
    
    // Find sections by looking for their text content
    const sections = {
        registration: findSectionByText('Quiz registration'),
        question: findSectionByText('Question 1'),
        correct: findSectionByText('✅Correct'),
        incorrect: findSectionByText('❌Incorrect'),
        leaderboard: findSectionByText('🏆 Leaderboard')
    };
    
    console.log('Found sections:', {
        registration: !!sections.registration,
        question: !!sections.question,
        correct: !!sections.correct,
        incorrect: !!sections.incorrect,
        leaderboard: !!sections.leaderboard
    });
    
    // Helper function to find a section by its text content
    function findSectionByText(text) {
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
            if (el.textContent && el.textContent.includes(text)) {
                return el.closest('div') || el;
            }
        }
        return null;
    }
    
    // Hide all sections except registration
    if (sections.question) sections.question.style.display = 'none';
    if (sections.correct) sections.correct.style.display = 'none';
    if (sections.incorrect) sections.incorrect.style.display = 'none';
    if (sections.leaderboard) sections.leaderboard.style.display = 'none';
    
    // Find form elements
    const inputs = document.querySelectorAll('input[type="text"]');
    const firstNameInput = inputs[0];
    const lastNameInput = inputs[1];
    const startButton = document.querySelector('button');
    
    console.log('Form elements:', {
        firstNameInput: !!firstNameInput,
        lastNameInput: !!lastNameInput,
        startButton: !!startButton
    });
    
    // Set up name input validation
    if (firstNameInput && lastNameInput && startButton) {
        // Initially hide the button
        startButton.style.display = 'none';
        
        function checkInputs() {
            if (firstNameInput.value.trim() !== '' && lastNameInput.value.trim() !== '') {
                startButton.style.display = 'block';
            } else {
                startButton.style.display = 'none';
            }
        }
        
        firstNameInput.addEventListener('input', checkInputs);
        lastNameInput.addEventListener('input', checkInputs);
        
        // Handle start button click
        startButton.addEventListener('click', function() {
            // Hide registration, show question
            if (sections.registration) sections.registration.style.display = 'none';
            if (sections.question) sections.question.style.display = 'block';
        });
    }
});
