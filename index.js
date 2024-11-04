const express = require("express");
const mysql = require("mysql");
const app = express();
const pool = require("./dbPool");
const { exec } = require("child_process");
const session = require("express-session");
const bcrypt = require("bcrypt");

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: "top secret!",
        resave: true,
        saveUninitialized: true,
    }),
);

// routes
app.get("/", function (req, res) {
    res.render("index");
});

app.post("/", function (req, res) {
    let username = req.body.username;
    let password = req.body.password;
    console.log("username: " + username);
    console.log("password: " + password);
    if (username == "admin" && password == "secret") {
        res.send("Right credentials!");
    } else {
        res.render("index");
    }
    res.send("This is the root route using POST!");
});

app.post("/user/verify", async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    let sql = `SELECT user_id, password_hash FROM users WHERE email = ?`;
    let params = [email];
    let rows = await executeSQL(sql, params);

    if (rows.length <= 0) {
        return res.render("index", {
            message: "No account exists with this information!",
        });
    }

    // Use bcrypt to compare passwords
    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match) {
        return res.render("index", { message: "Wrong Password!" });
    }

    req.session.user_id = rows[0].user_id;
    res.redirect("/home");
});

app.get("/user/signup", (req, res) => {
    res.render("signup.ejs");
});

app.post("/user/create", async (req, res) => {
    let { email, username, password, rePassword } = req.body;

    if (password !== rePassword) {
        return res.render("signup", { message: "Passwords do not match" });
    }

    let sql = `SELECT * FROM users WHERE email = ?`;
    let rows = await executeSQL(sql, [email]);
    if (rows.length > 0) {
        return res.render("signup", { message: "Email already in use!" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    sql = `INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)`;
    await executeSQL(sql, [email, username, hashedPassword]);

    res.redirect("/user/login");
});

app.get("/user/login", (req, res) => {
    res.render("index");
});

app.get("/home", isAuthenticated, (req, res) => {
    res.render("home");
});

app.get("/dbTest", async function (req, res) {
    let sql = "SELECT CURDATE()";
    let rows = await executeSQL(sql);
    res.send(rows);
}); //dbTest

// add recipe route
app.get("/addRecipe", (req, res) => {
    const message = req.query.message;
    res.render("addRecipe", { message });
});

app.post("/recipe/new", async function (req, res) {
    try {
        let userId = req.session.user_id;

        let {
            recipeName,
            recipeDescription,
            ingredientName,
            ingredientAmount,
            ingredientUnit,
            recipeSteps,
            servings,
            ready_in_minutes,
            image_url,
            source_url,
            recipe_type,
            dietary,
        } = req.body;

        // Insert into recipes
        let sql = `INSERT INTO recipes (recipe_name, recipe_description, image_url, servings, ready_in_minutes, source_url, is_user_added, user_id, recipe_type, dietary) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`;
        let params = [
            recipeName,
            recipeDescription,
            image_url,
            servings,
            ready_in_minutes,
            source_url,
            userId,
            recipe_type,
            dietary,
        ];
        let result = await executeSQL(sql, params);
        let recipeId = result.insertId;

        // Insert ingredients
        for (let i = 0; i < ingredientName.length; i++) {
            sql = `INSERT INTO ingredients (recipe_id, ingredient_name, amount, unit) VALUES (?, ?, ?, ?)`;
            params = [
                recipeId,
                ingredientName[i],
                ingredientAmount[i],
                ingredientUnit[i],
            ];
            await executeSQL(sql, params);
        }

        // Insert steps
        let steps = recipeSteps.split("\n").map((step) => step.trim());
        for (let i = 0; i < steps.length; i++) {
            sql = `INSERT INTO recipe_steps (recipe_id, step_number, description) VALUES (?, ?, ?)`;
            params = [recipeId, i + 1, steps[i]];
            await executeSQL(sql, params);
        }

        res.render("addRecipe", { message: "Recipe Added Successfully!" });
    } catch (error) {
        console.error(error);
        res.render("addRecipe", {
            message: "Error adding recipe. Please try again.",
        });
    }
});

//browse recipes route
app.get("/browseRecipes", async (req, res) => {
    const apikEY = "79529618ec934896883603be643525c0";
    const offset = Math.floor(Math.random() * 300);
    const featuredUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${apikEY}&number=3&offset=${offset}`;
    const response = await fetch(featuredUrl);
    const data = await response.json();
    const featuredRecipes = data.results;
    res.render("browseRecipes", { featuredRecipes, recipes: [] });
});

app.get("/browseRecipes/search", async (req, res) => {
    const query = req.query.query;
    const apikEY = "79529618ec934896883603be643525c0";
    const offset = Math.floor(Math.random() * 300);
    const url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${apikEY}&query=${query}&offset=${offset}`;
    const featuredUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${apikEY}&number=3`;
    const response = await fetch(url);
    const featuredResponse = await fetch(featuredUrl);
    const data = await response.json();
    const featuredData = await featuredResponse.json();
    res.render("browseRecipes", {
        featuredRecipes: featuredData.results,
        recipes: data.results,
    });
});

app.get("/api/recipe/:id", async (req, res) => {
    const recipeId = req.params.id;
    const apiKEY = "79529618ec934896883603be643525c0";
    const url = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(
                `Spoonacular API responded with status: ${response.status}`,
            );
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error fetching recipe details:", error);
        res.status(500).json({
            error: "Error fetching recipe details",
            message: error.message,
        });
    }
});

app.get("/listRecipes", isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user_id;
        const sql =
            "SELECT * FROM recipes WHERE is_user_added = 1 AND user_id = ?";
        const recipes = await executeSQL(sql, [userId]);
        res.render("listRecipes", { recipes });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching recipes");
    }
});

// Show edit form for a user added specific recipe
app.get("/recipe/edit/:id", async (req, res) => {
    try {
        const recipeId = req.params.id;
        // Fetch recipe details
        let sql = "SELECT * FROM recipes WHERE recipe_id = ?";
        const [recipe] = await executeSQL(sql, [recipeId]);
        // Fetch ingredients
        sql = "SELECT * FROM ingredients WHERE recipe_id = ?";
        recipe.ingredients = await executeSQL(sql, [recipeId]);
        // Fetch steps
        sql =
            "SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number";
        recipe.steps = await executeSQL(sql, [recipeId]);
        res.render("userRecipeDetails", { recipe }); // Changed this line
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching recipe details");
    }
});

// Handle recipe update for user added recipe
app.post("/recipe/update/:id", async (req, res) => {
    try {
        const recipeId = req.params.id;
        const {
            recipeName,
            recipeDescription,
            ingredientName,
            ingredientAmount,
            ingredientUnit,
            recipeSteps,
            servings,
            ready_in_minutes,
            image_url,
            source_url,
            recipe_type,
            dietary,
        } = req.body;

        // Update recipe
        let sql = `UPDATE recipes SET recipe_name = ?, recipe_description = ?, image_url = ?, servings = ?, ready_in_minutes = ?, source_url = ?, recipe_type = ?, dietary = ? WHERE recipe_id = ?`;
        let params = [
            recipeName,
            recipeDescription,
            image_url,
            servings,
            ready_in_minutes,
            source_url,
            recipe_type,
            dietary,
            recipeId,
        ];
        await executeSQL(sql, params);

        // Delete existing ingredients and steps
        await executeSQL("DELETE FROM ingredients WHERE recipe_id = ?", [
            recipeId,
        ]);
        await executeSQL("DELETE FROM recipe_steps WHERE recipe_id = ?", [
            recipeId,
        ]);

        // Insert updated ingredients
        for (let i = 0; i < ingredientName.length; i++) {
            sql = `INSERT INTO ingredients (recipe_id, ingredient_name, amount, unit) VALUES (?, ?, ?, ?)`;
            params = [
                recipeId,
                ingredientName[i],
                ingredientAmount[i],
                ingredientUnit[i],
            ];
            await executeSQL(sql, params);
        }

        // Insert updated steps
        let steps = recipeSteps.split("\n").map((step) => step.trim());
        for (let i = 0; i < steps.length; i++) {
            sql = `INSERT INTO recipe_steps (recipe_id, step_number, description) VALUES (?, ?, ?)`;
            params = [recipeId, i + 1, steps[i]];
            await executeSQL(sql, params);
        }

        res.redirect("/listRecipes");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating recipe");
    }
});

// Delete a user added recipe
app.get("/userRecipe/delete", async (req, res) => {
    let sql = `DELETE FROM recipes WHERE recipe_id = ${req.query.recipeId}`;
    let rows = await executeSQL(sql);
    res.redirect("/listRecipes");
});

app.get("/api/userRecipe/:id", async (req, res) => {
    let recipeId = req.params.id;

    try {
        // Fetch Recipe Info
        let recipeQuery = `SELECT * FROM recipes WHERE recipe_id = ?`;
        let recipe = await executeSQL(recipeQuery, [recipeId]);

        // Fetch ingredients
        let ingredientQuery = `SELECT ingredient_name, amount, unit FROM ingredients WHERE recipe_id = ?`;
        let ingredients = await executeSQL(ingredientQuery, [recipeId]);

        // Fetch steps
        let stepsQuery = `SELECT step_number, description FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number ASC`;
        let steps = await executeSQL(stepsQuery, [recipeId]);

        let recipeData = {
            recipe: recipe,
            ingredients: ingredients,
            steps: steps,
        };

        res.json(recipeData);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching recipe data");
    }
});

// logout
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        res.redirect("/");
    });
});

//functions
async function executeSQL(sql, params) {
    return new Promise(function (resolve, reject) {
        pool.query(sql, params, function (err, rows, fields) {
            if (err) throw err;
            resolve(rows);
        });
    });
} //executeSQL

function isAuthenticated(req, res, next) {
    if (req.session.user_id) {
        next();
    } else {
        res.redirect("/user/login");
    }
}

//start server
app.listen(3000, () => {
    console.log("Expresss server running...");
});
