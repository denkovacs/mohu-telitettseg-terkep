fetch('./components/navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('nav').innerHTML = data;

        const toggleBtn = document.querySelector(".menu-toggle");
        const dropdown = document.querySelector(".dropdown-menu");
        const menuLinks = document.getElementById("menu-links");

        const role = sessionStorage.getItem("role");
        if (role === "admin") {
            menuLinks.innerHTML = `
            <a class="label-link" href="index.html">Főoldal</a>
            <a class="label-link" href="telitettsegi_terkep.html">Telítettségi Térkép</a>
            <a class="label-link" href="vezerlopult.html">Vezérlőpult</a>
            <a class="" href="" style="float: right;" onclick="logout()">Kijelentkezés</a>
        `;
        }
        else if(role==="user"){
            menuLinks.innerHTML=`
            <a class="label-link" href="index.html">Főoldal</a>
            <a class="label-link" href="telitettsegi_terkep.html">Telítettségi Térkép</a>
            <a class="" href="" style="float: right;" onclick="logout()">Kijelentkezés</a>
        `;
        }


        if (toggleBtn && dropdown) {
            toggleBtn.addEventListener("click", () => {
                dropdown.classList.toggle("show");
                toggleBtn.textContent = dropdown.classList.contains("show") ? "✖" : "☰";
            });
        }
    });

function logout() {
    sessionStorage.removeItem("loggedIn");
    sessionStorage.removeItem("role");
    window.location.href = "login.html";
}