// Global app controller
import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, elementStrings, renderLoader, clearLoader } from './views/base';


/** Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */
const state = {};

/** 
 * SEARCH CONTROLLER 
 */
const controlSearch = async () => {
    // 1. Get query from the view
    const query = searchView.getInput();

    if(query) {
        // 2. Create new search object and add it to the state
        state.search = new Search(query);

        // 3. Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        try {
            // 4. Search for recipes
            await state.search.getResults();

            // 5. Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
            
        } catch(error) {
            alert('Something went wrong with your search query!');
            clearLoader();
        }
    }
    
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest(`.${elementStrings.paginationBtn}`);
    if(btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

/** 
 * RECIPE CONTROLLER 
 */
const controlRecipe = async () => {
    //1. Get the ID from the url
    const id = window.location.hash.replace('#', '');
    
    if(id) {
        //2. Prepare the UI for changes
        recipeView.clearRecipe()
        renderLoader(elements.recipe);

        //3. Highlight selected search item
        if(state.search) searchView.highlightSelected(id);

        //4. Create new recipe object
        state.recipe = new Recipe(id);
        

        try {
            //5. Get recipe data and parse ingredients
            await state.recipe.getRecipe();

            state.recipe.parseIngredients();

            //6. Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();

            //7. Render the recipe on UI
            
            clearLoader();

            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));

        } catch(error) {
            alert('Error processing recipe!');
        }
    }
};


/** 
 * LIST CONTROLLER 
 */

const controlList = () => {
    //1. Create a new list if there is none
    if(!state.list) {
        state.list = new List();
    }

    //2. Add each ingredient to the list
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);

        //3. Add item to the UI
        listView.renderItem(item);
    });
};

/** 
 * LIKES CONTROLLER 
 */

const controlLike = () => {
    //1. Create a new likes list if there is none
    if(!state.likes) {
        state.likes = new Likes();
    }

    const currentID = state.recipe.id;

    // Current recipe is not liked
    if(!state.likes.isLiked(currentID)) {
        // Add like to the state
        const {title, author, image} = state.recipe;
        const newLike = state.likes.addLike(currentID, title, author, image);

        // Toggle the like button
        likesView.toggleLikeBtn(true);

        // Add like to UI list
        likesView.renderLike(newLike);
        
    
    // Current recipe is liked
    } else {
    
        // Remove like to the state
        state.likes.deleteLike(currentID);

        // Toggle the like button
        likesView.toggleLikeBtn(false);

        // Remove like to UI list
        likesView.deleteLike(currentID);
        
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

/** 
 * RELOADS AND OTHER URL CHANGES 
 */

// Restore liked recipes on page load
window.addEventListener('load', () => {
    // 1. Create new likes object
    state.likes = new Likes();

    // 2. Restore likes from local storage
    state.likes.readStorage();

    // 3. Toggle the likes menu
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // 4. Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});

// Handling URL changes
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/** 
 * BUTTONS AND OTHER RELATED EVENTS 
 */

// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {

    if(e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if(state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateIngredients(state.recipe);
        } 

    } else if(e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateIngredients(state.recipe);

    } else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // Add to shopping cart is clicked
        controlList();

    } else if(e.target.matches('recipe__love, .recipe__love *')) {
        // Like button is clicked
        controlLike();
    }
});


// Handling shopping list button clicks
elements.shopping.addEventListener('click', e => {

    //1. Find item id
    const id = e.target.closest(`.${elementStrings.shoppingItem}`).dataset.itemid;

    //2. Delete item
    if(e.target.matches('.shopping__delete, .shopping__delete *')) {
        // 2.1 Delete item from state
        state.list.deleteItem(id);

        // 2.2. Delete item from UI
        listView.deleteItem(id);

    } 
    // 3. OR Update item
    else if(e.target.matches('.shopping__count--value')) {
        //3.1 Read value from UI
        const val = parseFloat(e.target.value);

        //3.2 Update the value
        state.list.updateCount(id, val);
    }
});