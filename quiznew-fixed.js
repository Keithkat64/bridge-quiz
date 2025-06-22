document.addEventListener("DOMContentLoaded", function () {
    const questions = Array.from(document.querySelectorAll("#hiddenData .question"));
    const questionBox = document.getElementById("questionBox");
    const southHandBox = document.getElementById("southhandBox");
    const biddingBox = document.getElementById("biddingBox");
    const optionsBox = document.getElementById("optionsBox");
    const seeAnswerBtn = document.getElementById("see-answer");

    let currentQuestionIndex = 0;
    let selectedAnswer = null;

    function loadQuestion(index) {
        const question = questions[index];
        if (!question) return;

        const southhand = question.querySelector(".southhand")?.innerHTML || "";
        const bidding = question.querySelector(".bidding")?.innerHTML || "";
        const options = ["a", "b", "c", "d"];
        
        southHandBox.innerHTML = '<span class="south-label">South holds</span><br>' + southhand;
        biddingBox.innerHTML = bidding;
        optionsBox.innerHTML = ""; // Clear previous

        options.forEach(letter => {
            const text = question.querySelector(".option-" + letter)?.textContent || "";
            if (text.trim()) {
                const btn = document.createElement("div");
                btn.className = "option-btn";
                btn.dataset.option = letter;
                btn.innerHTML = `<span class="option-letter">${letter.toUpperCase()}</span><span class="option-text">${text.slice(3)}</span>`;
                btn.addEventListener("click", () => handleOptionClick(letter));
                optionsBox.appendChild(btn);
            }
        });

        seeAnswerBtn.disabled = true;
        seeAnswerBtn.style.display = "none";

        questionBox.style.display = "block";
    }

    function handleOptionClick(letter) {
        selectedAnswer = letter;
        document.querySelectorAll(".option-btn").forEach(btn => {
            btn.classList.remove("selected");
            if (btn.dataset.option === letter) {
                btn.classList.add("selected");
            }
        });
        seeAnswerBtn.disabled = false;
        seeAnswerBtn.style.display = "block";
    }

    seeAnswerBtn.addEventListener("click", () => {
        const question = questions[currentQuestionIndex];
        const correctAnswer = question.dataset.answer;
        const solution = question.querySelector(".solution")?.innerHTML || "";

        if (selectedAnswer === correctAnswer) {
            alert("✅ Correct!\\n\\n" + solution);
        } else {
            alert("❌ Incorrect.\\n\\n" + solution);
        }

        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion(currentQuestionIndex);
        } else {
            alert("You've finished the quiz!");
        }
    });

    loadQuestion(currentQuestionIndex);
});