//Donate via bank transfer button

document.addEventListener("DOMContentLoaded", function () {
    const bankButton = document.getElementById("bankButton");
    const modalError = document.querySelector(".modal_error");
  
    bankButton.addEventListener("click", function (event) {
      event.preventDefault();
  
      // Collect the total amount from the existing element
      const amountText = document.getElementById("donationCalc").textContent;
      const totalAmount = parseFloat(amountText.replace("A$", ""));
  
      // Get all checked checkboxes
      const checkedCheckboxes = document.querySelectorAll(".donation_checkbox:checked");
      if (checkedCheckboxes.length === 0) {
        modalError.style.display = "block";
        return;
      }
  
      // Collect donation details
      const donationDetails = [];
  
      checkedCheckboxes.forEach((checkbox) => {
        const row = checkbox.closest(".donation_row");
        const charity = row.querySelector(".donation_char").textContent.trim();
        const donationAmountText = row.querySelector(".char_donation-number").textContent.trim();
        const donationAmount = parseFloat(donationAmountText.replace("A$", ""));
  
        donationDetails.push({
          charity: charity,
          amount: donationAmount.toFixed(2),
        });
      });
  
      // Create an object to store
      const dataToPass = {
        donationDetails: donationDetails,
        totalAmount: totalAmount.toFixed(2),
      };
  
      // Store the data in localStorage
      localStorage.setItem("bankDonationData", JSON.stringify(dataToPass));
  
      // Redirect to the new page (replace with your actual URL)
      //window.location.href = "/your-new-page-url"; // e.g., "/bank-donation-page.html"
    });
  });