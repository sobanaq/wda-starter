let MovieHelperInstance;

//Load MovieHelper class
async function loadMovieHelper() {
  if (!MovieHelperInstance) {
    const module = await import("./MovieHelper.js");
    MovieHelperInstance = new module.default(); // Create instance
  }
  return MovieHelperInstance;
}

// --- Spotify Integration ---
async function getSpotifyToken() {
  const client_id = "d71782d450f44101ba021b2985090a77";
  const client_secret = "1c4431c59ea140f4862e0070e9f5fa8a";

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(client_id + ":" + client_secret),
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

async function getSpotifyTrack(movieTitle) {
  const token = await getSpotifyToken();
  const query = encodeURIComponent(movieTitle + " soundtrack");

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
    {
      headers: { Authorization: "Bearer " + token },
    }
  );

  const data = await response.json();
  if (data.tracks.items.length > 0) {
    return data.tracks.items[0]; // return first track
  } else {
    return null;
  }
}

// Get URL parameter
function getUrlParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// --- Movie List Component ---
let movieListComponent = {
  movies: [],
  genres: [],
  selectedGenre: "",
  filter_year: "",
  filter_runtime: "",
  searchKeyword: "",
  page: 1,
  error: null,

  async init() {
    this.loadGenres();
    await this.loadMovies();
  },

  async loadGenres() {
    const helper = await loadMovieHelper();
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/genre/movie/list?api_key=${helper.api_key}&language=en-US`
      );
      const json = await response.json();
      this.genres = json.genres;
    } catch (error) {
      console.error("Failed to load genres:", error);
    }
  },

  async loadMovies() {
    try {
      const helper = await loadMovieHelper();
      let allMovies = await helper.getMovies(
        this.page,
        this.searchKeyword,
        this.filter_year,
        this.selectedGenre
      );

      // delay for runtime data
      await new Promise((r) => setTimeout(r, 300));

      // Filter by year
      if (this.filter_year) {
        allMovies = allMovies.filter((m) =>
          m.release_date?.startsWith(this.filter_year)
        );
      }

      // Filter by genre
      if (this.selectedGenre) {
        allMovies = allMovies.filter((m) =>
          m.genre_ids.includes(Number(this.selectedGenre))
        );
      }

      // Filter by search keyword
      if (this.searchKeyword) {
        allMovies = allMovies.filter((m) =>
          m.title.toLowerCase().includes(this.searchKeyword.toLowerCase())
        );
      }

      // Filter by runtime
      if (this.filter_runtime) {
        allMovies = allMovies.filter((m) => {
          const runtime = m.runtime || 0;
          if (this.filter_runtime === "short") return runtime && runtime < 90;
          if (this.filter_runtime === "medium")
            return runtime >= 90 && runtime <= 120;
          if (this.filter_runtime === "long") return runtime > 120;
          return true;
        });
      }

      // Fetch certification for each movie (GB → US fallback)
      await Promise.all(
        allMovies.map(async (movie) => {
          try {
            const certResponse = await fetch(
              `https://api.themoviedb.org/3/movie/${movie.id}/release_dates?api_key=${helper.api_key}`
            );
            const certData = await certResponse.json();

            let countryRelease =
              certData.results.find((r) => r.iso_3166_1 === "GB") ||
              certData.results.find((r) => r.iso_3166_1 === "US");

            movie.certification =
              countryRelease && countryRelease.release_dates.length > 0
                ? countryRelease.release_dates[0].certification || "Not rated"
                : "Not rated";
          } catch {
            movie.certification = "Not rated";
          }
        })
      );

      this.movies = allMovies;
    } catch (err) {
      this.error = "Failed to load movies.";
      console.error(err);
    }
  },

  addToWatchlist(movie) {
    let watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    if (!watchlist.find((m) => m.id === movie.id)) watchlist.push(movie);
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
    alert(`${movie.title} added to watchlist`);
  },
};

// --- Single Movie Component ---
let movieComponent = {
  movie: null,
  soundtrack: null,
  certification: null,
  productionCompany: null,
  productionCountry: null,

  init() {
    const movie_id = getUrlParam("movie_id");
    if (movie_id) this.loadMovie(movie_id);
  },

  async loadMovie(movie_id) {
    try {
      const helper = await loadMovieHelper();

      // Fetch movie details
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movie_id}?api_key=${helper.api_key}&language=en-US`
      );
      this.movie = await response.json();

      // Get production info
      if (this.movie.production_companies && this.movie.production_companies.length > 0) {
        this.productionCompany =
          this.movie.production_companies[0].name || "Unknown";
        this.productionCountry =
          this.movie.production_companies[0].origin_country || "Unknown";
      } else {
        this.productionCompany = "Unknown";
        this.productionCountry = "Unknown";
      }

      // Fetch soundtrack
      this.soundtrack = await getSpotifyTrack(this.movie.title);

      // Fetch certification data
      const certResponse = await fetch(
        `https://api.themoviedb.org/3/movie/${movie_id}/release_dates?api_key=${helper.api_key}`
      );
      const certData = await certResponse.json();

      // Try GB first, fallback to US
      let countryRelease =
        certData.results.find((r) => r.iso_3166_1 === "GB") ||
        certData.results.find((r) => r.iso_3166_1 === "US");

      if (countryRelease && countryRelease.release_dates.length > 0) {
        this.certification =
          countryRelease.release_dates[0].certification || "Not rated";
      } else {
        this.certification = "Not rated";
      }
    } catch (err) {
      console.error("Failed to load movie:", err);
      this.certification = "Not rated";
      this.productionCompany = "Unknown";
      this.productionCountry = "Unknown";
    }
  },
    addToWatchlist(movie) {
    let watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    if (!watchlist.find((m) => m.id === movie.id)) watchlist.push(movie);
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
    alert(`${movie.title} added to watchlist`);
  },
};

// --- Watchlist Component ---
let watchlistComponent = {
  watchlist: [],

  init() {
    this.watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
  },

  removeFromWatchlist(id) {
    this.watchlist = this.watchlist.filter((m) => m.id !== id);
    localStorage.setItem("watchlist", JSON.stringify(this.watchlist));
  },
};
