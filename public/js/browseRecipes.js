document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('recipeModal');
  const modalImage = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalDescription = document.getElementById('modalDescription');
  const modalIngredients = document.getElementById('modalIngredients');
  const modalInstructions = document.getElementById('modalInstructions');

  
  modal.addEventListener('show.bs.modal', function(event) {
    const button = event.relatedTarget;
    const recipeId = button.getAttribute('data-recipe-id');

  
    modalImage.src = '';
    modalTitle.textContent = 'Loading...';
    modalDescription.textContent = '';
    modalIngredients.innerHTML = '';
    modalInstructions.innerHTML = '';

    // Fetch recipe details using Fetch API
    fetch(`/api/recipe/${recipeId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(recipe => {
        console.log("Received recipe data:", recipe);

        if (!recipe || typeof recipe !== 'object') {
          throw new Error('Invalid recipe data received');
        }

        // Update modal content
        modalImage.src = recipe.image 
        modalTitle.textContent = recipe.title || 'No title available';
        modalDescription.innerHTML = recipe.summary || 'No description available';

        // Ingredients
        if (recipe.extendedIngredients && Array.isArray(recipe.extendedIngredients)) {
          recipe.extendedIngredients.forEach(ingredient => {
            const li = document.createElement('li');
            li.textContent = `${ingredient.amount || ''} ${ingredient.unit || ''} ${ingredient.name || ''}`;
            modalIngredients.appendChild(li);
          });
        } else {
          modalIngredients.textContent = 'No ingredient information available.';
        }

        // Instructions
        if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
          recipe.analyzedInstructions[0].steps.forEach(step => {
            const li = document.createElement('li');
            li.textContent = step.step || '';
            modalInstructions.appendChild(li);
          });
        } else {
          modalInstructions.textContent = 'No instructions available.';
        }
      })
      .catch(error => {
        console.error('Error fetching recipe details:', error);
        console.error('Recipe ID:', recipeId);
        modalTitle.textContent = 'Error loading recipe details';
        modalDescription.textContent = 'There was an error loading the recipe details. Please try again later.';
      });
  });
});