document.addEventListener('DOMContentLoaded', function() {
    console.log('Debug script loaded v1.0');
    
    // Log all elements with IDs
    const elementsWithId = document.querySelectorAll('[id]');
    console.log('Elements with IDs:');
    elementsWithId.forEach(el => {
        console.log(`${el.tagName} #${el.id}`);
    });
    
    // Log all form elements
    const formElements = document.querySelectorAll('input, button');
    console.log('Form elements:');
    formElements.forEach(el => {
        console.log(`${el.tagName} type=${el.type} id=${el.id} name=${el.name}`);
    });
    
    // Log the registration module
    const registrationModule = document.getElementById('registration');
    console.log('Registration module found:', !!registrationModule);
    if (registrationModule) {
        console.log('Registration module HTML:', registrationModule.innerHTML);
    }
    
    // Try to find the form elements directly
    const firstNameInput = document.querySelector('input[id="firstName"], input[name="firstName"]');
    const lastNameInput = document.querySelector('input[id="lastName"], input[name="lastName"]');
    const startQuizButton = document.querySelector('button[id="startquizbtn"], button[type="submit"]');
    
    console.log('Direct element search:');
    console.log('firstName:', firstNameInput ? firstNameInput.outerHTML : 'not found');
    console.log('lastName:', lastNameInput ? lastNameInput.outerHTML : 'not found');
    console.log('startButton:', startQuizButton ? startQuizButton.outerHTML : 'not found');
});
