// Cutting Recipe Merger
// Merges different Farmer's Delight recipes for the same input item.
// REduces individual chances proportionally to the merged recipes.
// GitHub Repository: https://github.com/Yaldaba0th/KubeJS-Scripts/

// Place this file in the kubejs/server_scripts folder of your Minecraft instance.


function cuttingMerge() {


    let scriptVersion = "1.1";

    let cuttingByInput = {};

    let cutters = ["farmersdelight:flint_knife", "farmersdelight:iron_knife", "farmersdelight:gold_knife", "minecraft:stick"];

    function getTool(tool) {
        var input = "";
        try {
            if (tool.has('item')) {
                input = tool.get("item");
                return [("" + input).replace(/['"]/g, ''), "item"]
            }
            else if (tool.has('tag')) {
                input = tool.get("tag");
                return [("" + input).replace(/['"]/g, ''), "tag"]
            }
            else {
                return [null, null]
            }
        } catch (error) {
            console.log("ERROR IN TOOL.");
            return [null, null]
        }


    }

    function processIngredient(ingredient, recipe) {
        var input = "";
        try {
            if (ingredient.has('item')) {
                input = ingredient.get("item");
                console.log("Found input:", input);
                addByInput([input, "item", null], recipe);
            }
            else if (ingredient.has('tag')) {
                input = ingredient.get("tag");
                console.log("Found input:", input);

                var tagstr = ("#" + input).replace(/['"]/g, '');
                console.log("Tag Detected: ", tagstr);
                let itemIds = Ingredient.of(tagstr).itemIds
                itemIds.forEach(id => {
                    console.log(id);
                    addByInput([id, "item", tagstr], recipe);
                });


            } else {
                console.log("Nothing to do.");
                return [null, null, null];
            }
        } catch (error) {
            console.log("ERROR IN PROCESS: ", recipe.json);
            return [null, null, null];
        }


    }

    function addByInput(inputype, recipe) {
        const input = (inputype[0] + "").replace(/['"]/g, '');
        const tipo = inputype[1];
        const tagstr = inputype[2];
        const toolData = getTool(recipe.json.get('tool'));

        if (!cuttingByInput[input]) {
            cuttingByInput[input] = [];
        }

        const results = recipe.json.get('result');
        let resultArray = []
        for (let i = 0; i < results.size(); i++) {
            var result = results.get(i)
            resultArray.push({
                item: result.get('item'),
                count: result.has('count') ? result.get('count') : 1,
                chance: result.has('chance') ? result.get('chance') : 1.0
            })
        }

        cuttingByInput[input].push({
            inputType: tipo,
            results: resultArray,
            tag: tagstr,
            tool: toolData[0],
            toolType: toolData[1]
        })

    }

    function processingHelper(ingredient, recipe) {
        var inputype = [];
        inputype = processIngredient(ingredient, recipe);

    }

    ServerEvents.recipes(event => {

        console.log("Starting Cutting Recipe Merger script (Version: " + scriptVersion + ")...");
        console.log("You can check the latest version of this file at:");
        console.log("https://github.com/Yaldaba0th/KubeJS-Scripts/blob/main/farmersdelight/cutting-recipe-merger.js");
        console.log("-------------------------------");
        console.log("Looking for recipes...");

        event.forEachRecipe({ type: 'farmersdelight:cutting' }, recipe => {

            const ingredients = recipe.json.get('ingredients').get(0);
            processingHelper(ingredients, recipe);

        })

        console.log("-------------------------------");
        console.log("Inputs with multiple recipes:");
        console.log("-------------------------------");

        for (let input in cuttingByInput) {
            var inputRecipes = cuttingByInput[input];
            var recipenum = inputRecipes.length;
            if (recipenum > 1) {
                console.log(input);
                console.log("Recipes: " + recipenum);
                console.log();
                console.log("------------------------------------------");

                var newIngredients = [{ item: input.replace(/['"]/g, '') }];

                var tagsToKill = [];

                var newResults = [];
                for (let i = 0; i < recipenum; i++) {
                    var oldResults = inputRecipes[i].results;

                    for (let j = 0; j < oldResults.length; j++) {
                        var oldResult = oldResults[j];
                        newResults.push({
                            item: oldResult.item,
                            count: oldResult.count,
                            chance: Math.max(Math.max(oldResult.chance / recipenum, oldResult.chance / 4), 0.1)
                        });
                    }

                    var tag = inputRecipes[i].tag;
                    if (!tagsToKill.includes(tag)) {
                        tagsToKill.push(tag)
                    }

                }

                // var oldToolData = [inputRecipes[0].tool, inputRecipes[0].toolType];
                // var newTool = {};
                // if (oldToolData[1] == "item") {
                //     newTool = { item: oldToolData[0] };
                // } else if (oldToolData[1] == "tag") {
                //     newTool = { tag: oldToolData[0] };
                // }
                // else {
                //     continue;
                // }


                event.remove({ input: input, type: 'farmersdelight:cutting' });

                if (newResults.length > 4) {
                    let numberOfRecipes = Math.ceil(newResults.length / 4);

                    for (let recipeIndex = 0; recipeIndex < numberOfRecipes; recipeIndex++) {
                        let startIndex = recipeIndex * 4;
                        let recipeResults = newResults.slice(startIndex, startIndex + 4);

                        recipeResults = recipeResults.map(result => ({
                            item: result.item,
                            count: result.count,
                            chance: Math.min(result.chance * (4 / recipeResults.length), 1.0)
                        }));

                        let toolIndex = recipeIndex % cutters.length;
                        let currentTool = cutters[toolIndex];

                        let toAdd = {
                            type: 'farmersdelight:cutting',
                            ingredients: newIngredients,
                            result: recipeResults,
                            tool: { item: currentTool }
                        };
                        event.custom(toAdd);

                    }
                } else {
                    let toAdd = {
                        type: 'farmersdelight:cutting',
                        ingredients: newIngredients,
                        result: newResults,
                        tool: { tag: 'forge:tools/knives' }
                    };
                    event.custom(toAdd);

                }

            }

        }

        console.log("-------------------------------");
        console.log("Finished Cutting Recipe Merger script.");


    });

}

CuttingMerge();
