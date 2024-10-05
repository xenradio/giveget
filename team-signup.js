//------------------
//Show hide password
//------------------

$("#showPassword").click(function(){
    $("#signupPassword").attr("type", "text");
  });
  $("#hidePassword").click(function(){
    $("#signupPassword").attr("type", "password");
  });

//------
//Signup
//------

  document.addEventListener("DOMContentLoaded", function () {
    const signupButton = document.getElementById("signupSubmitBtn");
    const errorMessage = document.getElementById("signupError");
    const urlParams = new URLSearchParams(window.location.search);
    const company = urlParams.get("company"); // Get 'company' parameter from URL
  
    // If there's a 'company' parameter, set it as the value of the company input field
    if (company) {
      document.getElementById("signupCompany").value = company;
      localStorage.setItem("company_identifier", company); // Store the company identifier
    }
  
    signupButton.addEventListener("click", function (event) {
      event.preventDefault();
  
      const formData = {
        company: document.getElementById("signupCompany").value,
        name: document.getElementById("signupName").value,
        email: document.getElementById("signupEmail").value,
        password: document.getElementById("signupPassword").value,
      };
  
      fetch("https://xrzc-g8gr-8fko.n7d.xano.io/api:wXyyqNPC/auth/signup", { //new workspace
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((data) => {
              throw new Error(
                data.message || "Failed to signup. Status: " + response.status
              );
            });
          }
          return response.json();
        })
        .then((data) => {
          if (data.error) {
            throw new Error(data.message);
          }
          localStorage.setItem("authToken", data.authToken); // Store the auth token
          window.location.href = "/survey"; // Redirect to the survey page after successful signup
        })
        .catch((error) => {
          console.error("Error:", error);
          errorMessage.style.display = "block";
          errorMessage.textContent = error.message;
        });
    });
  });  