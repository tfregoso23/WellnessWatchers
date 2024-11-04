document.getElementById("loginForm").addEventListener("submit", (e) => {
  var email = document.getElementById("email").value;
  localStorage.setItem("userEmail", email);
});
