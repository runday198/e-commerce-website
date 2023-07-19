const arrowDown = document.querySelectorAll(".expand-icon");

const arrowUp = document.querySelectorAll(".collapse-icon");

const questions = document.querySelectorAll(".question");

const questionContainer = document.querySelectorAll(".question-container");

console.log(arrowDown);

questions.forEach((item, index) => {
  item.addEventListener("click", () => {
    questionContainer[index].classList.toggle("answer-open");
  });
});

arrowDown.forEach((item, index) => {
  item.addEventListener("click", () => {
    questionContainer[index].classList.add("answer-open");
  });
});

arrowUp.forEach((item, index) => {
  item.addEventListener("click", () => {
    questionContainer[index].classList.remove("answer-open");
  });
});
