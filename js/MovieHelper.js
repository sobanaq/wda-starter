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

async getMovies(page = 1, searchKeyword = '', filter_year = '', genreId = '') {
  let endpoint;
  let urlParams = `?api_key=${this.api_key}&language=en-US&page=${page}`;

  if (searchKeyword) {
    // If user typed something, search by keyword
    endpoint = "search/movie";
    urlParams += `&query=${encodeURIComponent(searchKeyword)}`;
  } else {
    // Otherwise, use discover to browse
    endpoint = "discover/movie";
    if (filter_year) urlParams += `&year=${filter_year}`;
    //search by genre
    if (genreId) urlParams += `&with_genres=${genreId}`; 
  }

  const url = `${this.api_root}/${endpoint}${urlParams}`;

  try {
    const response = await fetch(url);
    const json = await response.json();
    return json.results;
  } catch (error) {
    console.error("Error fetching:", error);
    return [];
  }
}

}
