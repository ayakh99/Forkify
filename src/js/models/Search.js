import axios from 'axios';

export default class Search {

    constructor(query) {
        this.query = query;
    }

    async getResults() {
        try {
            // spoonacular api
            // const PROXY = 'https://cors-anywhere.herokuapp.com/';
            // const apiKey = 'ac35e59572f8447eb8c4184518191beb';
            // const res = await axios(`${PROXY}https://api.spoonacular.com/recipes/complexSearch?query=${this.query}&apiKey=${apiKey}`);
            // this.result = res.data.results;

            const res = await axios(`https://forkify-api.herokuapp.com/api/search?&q=${this.query}`);

            this.result = res.data.recipes;
            // console.log(this.result);
        }
        catch(error) {
            alert(error);
        }
    }
}