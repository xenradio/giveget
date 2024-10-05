document.getElementById('passBtn').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the form from submitting in the traditional way
    const email = document.getElementById('pasEmail').value;
    const password = document.getElementById('passPassword').value;

    const data = {
        email: email,
        password: password
    };

    fetch('https://xrzc-g8gr-8fko.n7d.xano.io/api:wXyyqNPC/auth/updatepassword', { //new workspace
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP status ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log(data); // It's helpful to log this for debugging.
        if (data.error) {
            document.querySelector('.password_message').textContent = "Error: Incorrect email or unable to update password.";
        } else {
            document.querySelector('.password_message').innerHTML = "Your password has been updated successfully. <a href='/team-login'>Please login</a>";
        }
        document.querySelector('.password_message').style.display = 'block';
        // Hide Webflow's default messages
        document.querySelector('.w-form-done').style.display = 'none';
        document.querySelector('.w-form-fail').style.display = 'none';
    })
    .catch((error) => {
        console.error('Error:', error);
        document.querySelector('.password_message').innerHTML = "User does not exist. <a href='/team-signup'>Please sign up</a> before you can sign in.";
        document.querySelector('.password_message').style.display = 'block';
        document.querySelector('.w-form-done').style.display = 'none';
        document.querySelector('.w-form-fail').style.display = 'none';
    });
});

//------------------
//Show hide password
//------------------

	$("#showPassword").click(function(){
  $("#passPassword").attr("type", "text");
});
$("#hidePassword").click(function(){
  $("#passPassword").attr("type", "password");
});