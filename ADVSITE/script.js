const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");

menuBtn.addEventListener("click", () => {
menu.classList.toggle("active");
});

document.querySelectorAll("#menu a").forEach(link => {

```
link.addEventListener("click", () => {
    menu.classList.remove("active");
});
```

});

const ano = document.getElementById("ano");

if (ano) {
ano.textContent = new Date().getFullYear();
}

const contactForm = document.getElementById("contactForm");

if (contactForm) {

```
contactForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const nome = document
        .getElementById("nome")
        .value
        .trim();

    alert(
        "Obrigado, " +
        nome +
        "! Sua solicitação foi preenchida."
    );

    contactForm.reset();

});
```

}
