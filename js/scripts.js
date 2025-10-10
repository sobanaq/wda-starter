let MovieHelperInstance;

// Load MovieHelper class
async function loadMovieHelper() {
    if (!MovieHelperInstance) {
        const module = await import('./MovieHelper.js');
        MovieHelperInstance = new module.default(); // Create instance
    }
    return MovieHelperInstance;
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
  selectedGenre: '',
  filter_year: '',
  searchKeyword: '',
  maxRuntime: '',
  error: null,
  init() {
    this.loadGenres();
    this.loadMovies();
  },

  async loadGenres() {
    const helper = await loadMovieHelper();
    try {
      const response = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${helper.api_key}&language=en-US`);
      const json = await response.json();
      this.genres = json.genres;
    } catch (error) {
      console.error("Failed to load genres:", error);
    }
  },

  async loadMovies() {
    try {
      const helper = await loadMovieHelper();
      let allMovies = await helper.getMovies(this.page, this.searchKeyword, this.filter_year, this.selectedGenre);

    //Filter by year
      if (this.filter_year) {
        allMovies = allMovies.filter(m => m.release_date?.startsWith(this.filter_year));
    //Filter by genre
      }
      if (this.selectedGenre) {
        allMovies = allMovies.filter(m => m.genre_ids.includes(Number(this.selectedGenre)));
      }
    // Filter by search keyword
      if (this.searchKeyword) {
        allMovies = allMovies.filter(m =>
          m.title.toLowerCase().includes(this.searchKeyword.toLowerCase())
        );
    //Filter by runtime
        if (this.maxRuntime){
            allMovies = allMovies.filter(m => m.runtime && m.runtime <= Number(this.maxRuntime));
        }
      }

      this.movies = allMovies;
    } catch (err) {
      this.error = "Failed to load movies.";
      console.error(err);
    }
  },

  addToWatchlist(movie) {
    let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    if (!watchlist.find(m => m.id === movie.id)) watchlist.push(movie);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    alert(`${movie.title} added to watchlist`);
  }
};

// --- Single Movie Component ---
let movieComponent = {
    movie: null,
    init() {
        const movie_id = getUrlParam('movie_id');
        if (movie_id) this.loadMovie(movie_id);
    },
    async loadMovie(movie_id) {
        try {
            const helper = await loadMovieHelper();
            const response = await fetch(`https://api.themoviedb.org/3/movie/${movie_id}?api_key=${helper.api_key}&language=en-US`);
            this.movie = await response.json();
        } catch (err) {
            console.error("Failed to load movie:", err);
        }
    },
    addToWatchlist(movie) {
        let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        if (!watchlist.find(m => m.id === movie.id)) watchlist.push(movie);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        alert(`${movie.title} added to watchlist`);
    }
};

// --- Watchlist Component ---
let watchlistComponent = {
    watchlist: [],
    init() {
        this.watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    },
    removeFromWatchlist(id) {
        this.watchlist = this.watchlist.filter(m => m.id !== id);
        localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
    }
};
