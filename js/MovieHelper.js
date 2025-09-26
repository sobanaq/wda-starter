export default class MovieHelper {
    constructor() {
        this.api_root = "https://api.themoviedb.org/3"
        this.api_key = "d050a93b16e91b751e0bdfa713957657"
    }

    async apiRequest(endpoint) {
        let url = `${this.api_root}/${endpoint}?api_key=${this.api_key}&language=en-US`
        try {
            const response = await fetch(url);
            return response;
        } catch (error) {
            console.error("Error fetching: ", error);
        }
    }

    async getMovies() {
        const response = await this.apiRequest("discover/movie")
        const json = await response.json();
        return json.results;
    }
}
