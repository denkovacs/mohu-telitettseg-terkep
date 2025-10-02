const form=document.getElementById('loginForm');
const errorMsg=document.getElementById('error');

form.addEventListener('submit',function(e){
e.preventDefault();

const user=document.getElementById('username').value;
const pass=document.getElementById('password').value;

if(user=="admin"&& pass=="admin123"){
    sessionStorage.setItem("loggedIn","true");
    sessionStorage.setItem("role","admin");
    window.location.href="index.html";
}
else if(user=="user"&& pass=="user123"){
    sessionStorage.setItem("loggedIn","true");
    sessionStorage.setItem("role","user");
    window.location.href="index.html";
}
else{
    errorMsg.style.display="block";
}
});