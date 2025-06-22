
let currentQuestionIndex = 0;
let selectedAnswer = null;

document.addEventListener("DOMContentLoaded", function () {
    const questionBox = document.getElementById("questionBox");
    const southHandBox = document.getElementById("southhandBox");
    const biddingBox = document.getElementById("biddingBox");
    const optionsBox = document.getElementById("optionsBox");
    const seeAnswerBtn = document.getElementById("see-answer");
    const hiddenData = document.getElementById("hiddenData");
    const questionElements = hiddenData.querySelectorAll(".question");

    function loadQuestion(index) {
        const question = questionElements[index];
        if (!question) return;

        // Show question box
        questionBox.style.display = "block";

        // Fill in south hand
        southHandBox.innerHTML = "<span class='south-label'>South holds</span><br>" + question.querySelector(".southhand").innerHTML;

        // Fill in bidding
        biddingBox.innerHTML = question.querySelector(".bidding").outerHTML;

        // Fill in options
        const letters = ["a", "b", "c", "d"];
        letters.forEach(letter => {
            const opt = question.querySelector(".option-" + letter);
            const btn = document.getElementById("option-" + letter);
            if (opt && btn) {
                btn.querySelector(".option-text").textContent = opt.textContent.trim();
                btn.style.display = "block";
            } else if (btn) {
                btn.style.display = "none";
            }
        });

        // Reset button states
        selectedAnswer = null;
        seeAnswerBtn.disabled = true;
        seeAnswerBtn.style.display = "none";

        document.querySelectorAll(".option-btn").forEach(btn => {
            btn.classList.remove("selected");
            btn.onclick = null;
        });

        // Add new click listeners
        letters.forEach(letter => {
            const btn = document.getElementById("option-" + letter);
            if (btn) {
                btn.onclick = () => {
                    document.querySelectorAll(".option-btn").forEach(b => b.classList.remove("selected"));
                    btn.classList.add("selected");
                    selectedAnswer = letter;
                    seeAnswerBtn.disabled = false;
                    seeAnswerBtn.style.display = "block";
                };
            }
        });

        // Store solution
        seeAnswerBtn.onclick = () => {
            const correctAnswer = question.dataset.answer;
            const correctBox = document.getElementById("correctBox");
            const wrongBox = document.getElementById("wrongBox");
            const solutionText = question.querySelector(".solution").textContent;

            if (selectedAnswer === correctAnswer) {
                correctBox.querySelector(".solution-text").textContent = solutionText;
                correctBox.style.display = "block";
                wrongBox.style.display = "none";
            } else {
                wrongBox.querySelector(".solution-text").textContent = solutionText;
                wrongBox.style.display = "block";
                correctBox.style.display = "none";
            }
        };
    }

    // Initial load
    loadQuestion(currentQuestionIndex);
});
