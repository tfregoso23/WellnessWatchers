document.addEventListener("DOMContentLoaded", function () {
    var email = localStorage.getItem("userEmail");
    if (email) {
        console.log("Welcome, " + email + "!");
    }
});
