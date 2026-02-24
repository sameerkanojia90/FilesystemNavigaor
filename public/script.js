const signuppagebtn = document.querySelector(".signupF");
const loginPagebtn = document.querySelector(".loginF");
const signuPage = document.querySelector(".signup-page");
const loginPage = document.querySelector(".Login-page");

const signupBtn = document.getElementById("signup");
const loginBtn = document.getElementById("login");

signuppagebtn.addEventListener('click', () => {
  signuPage.style.display = "flex";
  loginPage.style.display = "none";
});

loginPagebtn.addEventListener('click', () => {
  loginPage.style.display = "flex";
  signuPage.style.display = "none";
});

signupBtn.addEventListener("click", async () => {

  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const name = document.getElementById("signup-name").value;
  const confirm = document.getElementById("signup-confirm").value;

  if (!email || !password || !name || !confirm) {
    alert("Fill all fields");
    return;
  }

  if (password !== confirm) {
    alert("Passwords do not match");
    return;
  }

  const res = await fetch("/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name })
  });

  alert(await res.text());


});

loginBtn.addEventListener('click', async () => {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    alert("Fill all fields");
    return;
  }

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.success) {
    window.location.href = data.redirect;
  } else {
    alert(data.message);
  }
});