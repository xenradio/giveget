//------------------
//Show hide password
//------------------

$("#showPassword").click(function(){
    $("#loginPassword").attr("type", "text");
  });
  $("#hidePassword").click(function(){
    $("#loginPassword").attr("type", "password");
  });
  
//------
//Login
//------

  document.addEventListener("DOMContentLoaded", function () {
    const loginButton = document.getElementById("loginBtn");
    const errorMessage = document.getElementById("signupError");
  
    loginButton.addEventListener("click", function (event) {
      event.preventDefault();
  
      const loginData = {
        email: document.getElementById("loginEmail").value,
        password: document.getElementById("loginPassword").value,
      };
  
      fetch("https://xrzc-g8gr-8fko.n7d.xano.io/api:wXyyqNPC/auth/login", { //new workspace
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((data) => {
              throw new Error(
                data.message || "Failed to login. Status: " + response.status
              );
            });
          }
          return response.json();
        })
        .then((data) => {
          console.log("Login response data:", data); 
  
          if (data.error) {
            throw new Error(data.message);
          }
  
          if (data.authToken) {
            localStorage.setItem("authToken", data.authToken); // Store the authToken
          } else {
            console.error("Token not found in response:", data);
            throw new Error("Authentication token not found.");
          }
  
          if (data.company_identifier) {
            localStorage.setItem("company_identifier", data.company_identifier); // Store the company identifier
          } else {
            console.error("Company identifier not found in response:", data);
            throw new Error("Company identifier not found.");
          }
  
          window.location.href = "/survey"; // Redirect after successful login
        })
        .catch((error) => {
          console.error("Error:", error);
          errorMessage.style.display = "block";
          errorMessage.textContent = error.message;
        });
    });
  });  