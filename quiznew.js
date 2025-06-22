
document.addEventListener('DOMContentLoaded', function () {
    let currentQuestionIndex = 0;
    const hiddenData = document.querySelectorAll('#hiddenData .question');
    const questionBox = document.getElementById('questionBox');
    const southhandBox = document.getElementById('southhandBox');
    const biddingBox = document.getElementById('biddingBox');
    const optionBtns = document.querySelectorAll('.option-btn');
    const seeAnswerBtn = document.getElementById('see-answer');
    let selectedOption = null;

    function loadQuestion(index) {
        if (index >= hiddenData.length) return;

        const data = hiddenData[index];
        const southhand = data.querySelector('.southhand')?.innerHTML || '';
        const bidding = data.querySelector('.bidding')?.innerHTML || '';
        const options = {
            a: data.querySelector('.option-a')?.textContent || '',
            b: data.querySelector('.option-b')?.textContent || '',
            c: data.querySelector('.option-c')?.textContent || '',
            d: data.querySelector('.option-d')?.textContent || '',
        };

        const correctAnswer = data.getAttribute('data-answer');

        southhandBox.innerHTML = '<span class="south-label">South holds</span><br>' + southhand;
        biddingBox.innerHTML = bidding;

        optionBtns.forEach(btn => {
            btn.classList.remove('selected');
            const id = btn.id;
            const letter = id.split('-')[1];
            const textSpan = btn.querySelector('.option-text');
            if (textSpan) {
                textSpan.textContent = options[letter] || '';
            }
        });

        selectedOption = null;
        seeAnswerBtn.disabled = true;

        seeAnswerBtn.onclick = function () {
            if (!selectedOption) return;

            const isCorrect = selectedOption.toLowerCase() === correctAnswer.toLowerCase();
            const correctBox = document.getElementById('correctBox');
            const wrongBox = document.getElementById('wrongBox');

            correctBox.style.display = isCorrect ? 'block' : 'none';
            wrongBox.style.display = isCorrect ? 'none' : 'block';

            const solutionText = data.querySelector('.solution')?.innerHTML || '';
            const solutionBox = isCorrect ? correctBox : wrongBox;
            const solutionArea = solutionBox.querySelector('.solution-text');
            if (solutionArea) {
                solutionArea.innerHTML = solutionText;
            }

            // Add "Next Question" Button
            const nextBtn = solutionBox.querySelector('.next-question-btn');
            nextBtn.onclick = function () {
                correctBox.style.display = 'none';
                wrongBox.style.display = 'none';
                currentQuestionIndex++;
                loadQuestion(currentQuestionIndex);
            };
        };
    }

    optionBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            optionBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedOption = btn.id.split('-')[1]; // 'a', 'b', 'c', 'd'
            seeAnswerBtn.disabled = false;
        });
    });

    loadQuestion(currentQuestionIndex);
});
