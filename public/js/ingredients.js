document.getElementById('add-ingredient').addEventListener('click', function() {
  const container = document.getElementById('ingredients-container');
  const newRow = container.querySelector('.ingredient-row').cloneNode(true);
  newRow.querySelectorAll('input').forEach(input => input.value = '');
  container.appendChild(newRow);
});