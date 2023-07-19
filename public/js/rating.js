const stars = document.querySelectorAll(".stars .star");
const starWrapper = document.querySelector(".stars");

const productId = document.querySelector(".id");

stars.forEach((star, index) => {
  star.addEventListener("click", () => {
    starWrapper.classList.add("disabled");
    stars.forEach((otherStar, otherIndex) => {
      if (otherIndex <= index) {
        otherStar.classList.add("active");
      }
    });
    let rating = index + 1;
    fetch("http://localhost:3000/rating", {
      method: "POST",
      body: {
        rating: rating,
        productId: productId,
      },
    });
  });
});
