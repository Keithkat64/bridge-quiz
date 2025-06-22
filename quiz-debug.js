document.addEventListener('DOMContentLoaded', function() {
    console.log('Debug script loaded - v1.0');
    
    // Find all forms on the page
    const allForms = document.querySelectorAll('form');
    console.log('All forms found:', allForms.length);
    allForms.forEach((form, index) => {
        console.log(`Form ${index}:`, {
            name: form.getAttribute('name'),
            id: form.id,
            className: form.className,
            html: form.outerHTML.substring(0, 100) + '...'
        });
    });
    
    // Find all inputs on the page
    const allInputs = document.querySelectorAll('input[type="text"]');
    console.log('All text inputs found:', allInputs.length);
    allInputs.forEach((input, index) => {
        console.log(`Input ${index}:`, {
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            value: input.value,
            parentNode: input.parentNode.tagName
        });
    });
    
    // Find all buttons on the page
    const allButtons = document.querySelectorAll('button');
    console.log('All buttons found:', allButtons.length);
    allButtons.forEach((button, index) => {
        console.log(`Button ${index}:`, {
            text: button.textContent,
            id: button.id,
            type: button.type,
            className: button.className
        });
    });
    
    // Find modules
    const modules = {
        registration: document.getElementById('registration'),
        questionbox: document.getElementById('questionbox'),
        correctBox: document.getElementById('correctBox'),
        wrongBox: document.getElementById('wrongBox'),
        leaderboard: document.getElementById('leaderboard')
    };
    
    console.log('Modules found:', {
        registration: !!modules.registration,
        questionbox: !!modules.questionbox,
        correctBox: !!modules.correctBox,
        wrongBox: !!modules.wrongBox,
        leaderboard: !!modules.leaderboard
    });
    
    // If registration module exists, log its contents
    if (modules.registration) {
        console.log('Registration module HTML:', modules.registration.innerHTML.substring(0, 200) + '...');
    }
    
    // Try to find the Elementor form
    const elementorForm = document.querySelector('form.elementor-form');
    console.log('Elementor form found:', !!elementorForm);
    
    if (elementorForm) {
        // Try to find the submit button
        const submitButton = elementorForm.querySelector('button[type="submit"]');
        console.log('Submit button found:', !!submitButton);
        
        if (submitButton) {
            // Add click event to the submit button
            submitButton.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Submit button clicked');
                
                // Hide registration module
                if (modules.registration) {
                    modules.registration.style.display = 'none';
                }
                
                // Show question module
                if (modules.questionbox) {
                    modules.questionbox.style.display = 'block';
                }
            });
        }
    }
});
