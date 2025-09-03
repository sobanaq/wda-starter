export default class MovieHelper {

    constructor() {
        // Define our API root URL, we can then add specific paths onto the end for different queries
        this.api_root = "https://api.themoviedb.org/3"
        // Define our API key here
        this.api_key = "68ad4349da5eeb9915c6b7077a42ec7d"
    }

    // Use this API endpoint: https://developer.themoviedb.org/reference/discover-movie
    async getMovies() {
        try {
            const response = await fetch(this.api_root+"/discover/movie")
            const data = await response.json();
            console.log (response)
        } catch (error) {
            
        }

    }
    

}