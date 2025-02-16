// Crushing Recipe Merger
// Merges different Create crushing recipes for the same input item.
// Averages the chances and processing time.
// GitHub Repository: https://github.com/Yaldaba0th/KubeJS-Scripts/

// Place this file in the kubejs/server_scripts folder of your Minecraft instance.



function crushingMerge() {

    let scriptVersion = "1.2";

    let crushingByInput = {};

    function processIngredient(ingredient) {
        var input = "";
        if (ingredient.has('item')) {
            input = ingredient.get("item");
            console.log("Found input:", input);
            return [input, "item"];
        }
        else if (ingredient.has('tag')) {
            input = ingredient.get("tag");
            console.log("Found input:", input);
            return [input, "tag"];
        } else {
            console.log("Nothing to do.");
            return [null, null];
        }

    }

    function addByInput(inputype, recipe) {
        const input = inputype[0];
        const tipo = inputype[1];

        if (!crushingByInput[input]) {
            crushingByInput[input] = [];
        }

        const results = recipe.json.get('results');
        let resultArray = []
        for (let i = 0; i < results.size(); i++) {
            var result = results.get(i)
            resultArray.push({
                item: result.get('item'),
                count: result.has('count') ? result.get('count') : 1,
                chance: result.has('chance') ? result.get('chance') : 1.0
            })
        }

        crushingByInput[input].push({
            inputType: tipo,
            results: resultArray,
            processingTime: recipe.json.get('processingTime') || 250
        })

    }

    let allowedInputTypes = ["item", "tag"];

    function processingHelper(ingredient, recipe) {
        var skipCheck = false;
        try {
            var keyWords = Array.from(ingredient.keySet().toArray());
            skipCheck = keyWords.some(kw => !allowedInputTypes.includes(kw));

            if (skipCheck) {
                console.log("Weird Keys: ", keyWords);
                return;
            }
        } catch (error) {
            //Nothing
        }

        var inputype = [];
        inputype = processIngredient(ingredient);
        addByInput(inputype, recipe);

    }

    ServerEvents.recipes(event => {
        console.log("Starting Crushing Recipe Merger script (Version: " + scriptVersion + ")...");
        console.log("You can check the latest version of this file at:");
        console.log("https://github.com/Yaldaba0th/KubeJS-Scripts/blob/main/create/crushing-recipe-merger.js");
        console.log("-------------------------------");
        console.log("Looking for recipes...");

        // get recipes by input
        event.forEachRecipe({ type: 'create:crushing' }, recipe => {
            const ingredients = recipe.json.get('ingredients').get(0);

            if (ingredients.size() > 1) {
                let skipCheck = false;
                try {
                    let keyWords = Array.from(ingredients.keySet().toArray());
                    skipCheck = keyWords.some(kw => !allowedInputTypes.includes(kw));
                    if (skipCheck) {
                        console.log("Weird Keys: ", keyWords);
                    }


                } catch (error) {
                    //Nothing.
                }

                if (!skipCheck) {
                    for (let i = 0; i < ingredients.size(); i++) {
                        processingHelper(ingredients.get(i), recipe);
                    }
                }

            }
            else {
                processingHelper(ingredients, recipe);

            }

            console.log("-------------------------------");

        });

        console.log("Inputs with multiple recipes:");
        console.log("-------------------------------");

        for (let input in crushingByInput) {
            var inputRecipes = crushingByInput[input];
            var recipenum = inputRecipes.length;
            if (recipenum > 1) {
                console.log(input);
                console.log("Recipes: " + recipenum);
                var newIngredients = [];
                var oldInputType = inputRecipes[0].inputType;
                if (oldInputType == "item") {
                    newIngredients = [{ item: input.replace(/['"]/g, '') }];
                } else if (oldInputType == "tag") {
                    newIngredients = [{ tag: input.replace(/['"]/g, '') }];
                } else {
                    continue;
                }

                var newResults = [];
                var oldTime = 0;
                for (let i = 0; i < recipenum; i++) {
                    oldTime = oldTime + Math.floor(inputRecipes[i].processingTime);
                    var oldResults = inputRecipes[i].results;

                    for (let j = 0; j < oldResults.length; j++) {
                        var oldResult = oldResults[j];
                        newResults.push({
                            item: oldResult.item,
                            count: oldResult.count,
                            chance: oldResult.chance / recipenum
                        });
                    }

                }
                var newTime = Math.floor(oldTime / recipenum);

                // remove old recipes
                if (oldInputType == "item") {
                    event.remove({ input: input.replace(/['"]/g, ''), type: 'create:crushing' })
                } else if (oldInputType == "tag") {
                    event.remove({ input: '#' + input.replace(/['"]/g, ''), type: 'create:crushing' })
                }

                // add merged recipe
                event.custom({
                    type: 'create:crushing',
                    ingredients: newIngredients,
                    processingTime: newTime,
                    results: newResults
                })

            }

        }

        console.log("-------------------------------");
        console.log("Finished Crushing Recipe Merger script.");

    });


}

crushingMerge();
