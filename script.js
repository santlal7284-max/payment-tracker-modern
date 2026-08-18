document.getElementById("paymentForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const category = document.getElementById("category").value;
  const amount = document.getElementById("amount").value;
  const dueDate = document.getElementById("dueDate").value;

  const table = document.getElementById("paymentTable");
  const row = table.insertRow();
  row.insertCell(0).innerText = category;
  row.insertCell(1).innerText = "₹" + amount;
  row.insertCell(2).innerText = dueDate;
  row.insertCell(3).innerText = "Pending";
});