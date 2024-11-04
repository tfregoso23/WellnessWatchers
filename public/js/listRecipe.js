// event listener
let recipeLinks = document.querySelectorAll("a.btn-primary");
for (let recipeLink of recipeLinks) {
    if (recipeLink.id) {
        recipeLink.addEventListener("click", getRecipeInfo);
    }
}

async function getRecipeInfo(event) {
    event.preventDefault();
    var myModal = new bootstrap.Modal(document.getElementById('userRecipeModal'));
    myModal.show();
    let url = `/api/userRecipe/${this.id}`;
    let response = await fetch(url);
    let data = await response.json();
    console.log(data);

    // Update modal content
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalDetails = document.getElementById('modalDetails');
    const modalIngredients = document.getElementById('modalIngredients');
    const modalInstructions = document.getElementById('modalInstructions');

    // Set image
    modalImage.src = data.recipe[0].image_url;
    modalImage.alt = data.recipe[0].recipe_name;

    // Set title
    modalTitle.textContent = data.recipe[0].recipe_name;

    // Set description
    modalDescription.textContent = data.recipe[0].recipe_description;

    // Set details
    modalDetails.innerHTML = `
        <p><strong>Ready in:</strong> ${data.recipe[0].ready_in_minutes} minutes</p>
        <p><strong>Servings:</strong> ${data.recipe[0].servings}</p>
        <p><strong>Meal Type:</strong> ${data.recipe[0].recipe_type}</p>
        <p><strong>Dietary Tags:</strong> ${data.recipe[0].dietary}</p>
    `;

    // Set ingredients
    modalIngredients.innerHTML = '';
    data.ingredients.forEach(ingredient => {
        const li = document.createElement('li');
        li.textContent = `${ingredient.amount} ${ingredient.unit} ${ingredient.ingredient_name}`;
        modalIngredients.appendChild(li);
    });

    // Set instructions
    modalInstructions.innerHTML = '';
    data.steps.forEach(step => {
        const li = document.createElement('li');
        li.textContent = step.description;
        modalInstructions.appendChild(li);
    });
}