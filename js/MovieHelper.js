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

  async getMovies(page = 1,searchKeyword = "",filter_year = "",genreId = "") {
    let endpoint;
    let urlParams = `?api_key=${this.api_key}&language=en-US&page=${page}`

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

  async getSpotifyToken() {
    const clientId = "d71782d450f44101ba021b2985090a77";
    const clientSecret = "1c4431c59ea140f4862e0070e9f5fa8a";

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${clientId}:${clientSecret}`),
      },
      body: "grant_type=client_credentials",
    });

    const data = await response.json();
    return data.access_token;
  }

  async getSoundtrack(movieTitle) {
    const token = await this.getSpotifyToken();
    const query = encodeURIComponent(`${movieTitle} soundtrack`);

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=album&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    return data.albums.items[0]; // return first matching album
  }
}
