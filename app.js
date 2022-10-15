const BASE_URL = "https://movie-list.alphacamp.io";
const INDEX_URL = BASE_URL + "/api/v1/movies/";
const POSTER_URL = BASE_URL + "/posters/";
const movies = [];
let filteredMovies = [];
const MOVIES_PER_PAGE = 12; //限制每頁的電影資料
const paginator = document.querySelector("#paginator");

// 函式，將陣列內的資料取出放入HTML的card中
const dataPanel = document.querySelector("#data-panel");

function renderMovieList(data) {
  let rawHTML = "";
  data.forEach((item) => {
    // title, image
    rawHTML += `
  <div class="col-sm-3">
    <div class="mb-2">
      <div class="card">
        <img src="${
          POSTER_URL + item.image
        }" class="card-img-top" alt="Movie Poster">
        <div class="card-body">
          <h5 class="card-title">${item.title}</h5>
        </div>
        <div class="card-footer">
          <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal" data-bs-target="#movie-modal" data-id="${
            item.id
          }">More</button>
          <button class="btn btn-info btn-add-favorite" data-id="${
            item.id
          }">+</button>
        </div>
      </div>
    </div>
  </div>`;
  });
  dataPanel.innerHTML = rawHTML;
}

//寫出List的形式
function renderListView(data) {
  let rawHTML = "";
  data.forEach((item) => {
    rawHTML += `
    <div class="row justify-content-around border-top">
      <div class="col">
        <ul class="list-group list-group-flush ">
          <li class="list-group-item list-title" >${item.title} <span></span></li>
        </ul>
      </div>
      <div class="col text-end">
        <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal" data-bs-target="#movie-modal" data-id="${item.id}">More</button>
        <button class="btn btn-info btn-add-favorite" data-id="${item.id}">+</button>
      </div>
    </div>`;
  });
  dataPanel.innerHTML = rawHTML;
}

// 將API中data.results放進movies陣列中
axios
  .get(INDEX_URL)
  .then((response) => {
    movies.push(...response.data.results);
    renderPaginator(movies.length); //確認要分多少頁
    renderMovieList(getMoviesByPage(1));
    localStorage.setItem("currentPage", 1);
  })
  .catch((err) => console.log(err));

// 客製化 Modal 元件  在HTML頁面中
// 定義將點擊後取得的id，利用以下函式取得整筆電影資料，再丟進local storage中
function addToFavorite(id) {
  const list = JSON.parse(localStorage.getItem("favoriteMovies")) || [];
  const movie = movies.find((movie) => movie.id === id);
  if (list.some((movie) => movie.id === id)) {
    return alert("此電影已經在收藏清單中！");
  }
  list.push(movie);
  localStorage.setItem("favoriteMovies", JSON.stringify(list));
}
// 動態綁定按鈕的點擊事件 (click events)
dataPanel.addEventListener("click", function onPanelClicked(event) {
  if (event.target.matches(".btn-show-movie")) {
    showMovieModal(Number(event.target.dataset.id));
    //新增以下用於監看+號按紐
  } else if (event.target.matches(".btn-add-favorite")) {
    addToFavorite(Number(event.target.dataset.id));
  }
});
// 取出特定電影的 id 資訊
// 向 Show API request 資料
function showMovieModal(id) {
  const modalTitle = document.querySelector("#movie-modal-title");
  const modalImage = document.querySelector("#movie-modal-image");
  const modalDate = document.querySelector("#movie-modal-date");
  const modalDescription = document.querySelector("#movie-modal-description");
  axios.get(INDEX_URL + id).then((response) => {
    const data = response.data.results;
    modalTitle.innerText = data.title;
    modalDate.innerText = "Release date: " + data.release_date;
    modalDescription.innerText = data.description;
    modalImage.innerHTML = `<img src="${
      POSTER_URL + data.image
    }" alt="movie-poster" class="img-fluid">`;
  });
}

//搜尋功能
const searchForm = document.querySelector("#search-form");
//取得搜尋框中輸入的值
const searchInput = document.querySelector("#search-input");

searchForm.addEventListener("submit", function onSearchFormSubmitted(event) {
  event.preventDefault();
  const keyword = searchInput.value.trim().toLowerCase();
  // 如果keyword長度等於0為真，則alert
  // if (!keyword.length) {
  //   return alert('請輸入有效字串！')
  // }
  filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(keyword)
  );
  //錯誤處理：無符合條件的結果
  if (filteredMovies.length === 0) {
    return alert(`您輸入的關鍵字：${keyword} 沒有符合條件的電影`);
  }
  //重製分頁器
  renderPaginator(filteredMovies.length);
  //預設顯示第 1 頁的搜尋結果
  renderMovieList(getMoviesByPage(1));
});

//蒐藏清單
//點擊喜歡的電影，每次點擊都會被丟到一個新的array中，再將array render到favorite.html中

//分頁器
function getMoviesByPage(page) {
  const data = filteredMovies.length ? filteredMovies : movies;
  //計算起始 index
  const startIndex = (page - 1) * MOVIES_PER_PAGE;
  //回傳切割後的新陣列
  return data.slice(startIndex, startIndex + MOVIES_PER_PAGE);
}

function renderPaginator(amount) {
  //計算總頁數
  const numberOfPages = Math.ceil(amount / MOVIES_PER_PAGE);
  //製作 template
  let rawHTML = "";

  for (let page = 1; page <= numberOfPages; page++) {
    rawHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${page}">${page}</a></li>`;
  }
  //放回 HTML
  paginator.innerHTML = rawHTML;
}

paginator.addEventListener("click", function onPaginatorClicked(event) {
  //如果被點擊的不是 a 標籤，結束
  if (event.target.tagName !== "A") return;

  //透過 dataset 取得被點擊的頁數
  const page = Number(event.target.dataset.page);
  //將page存在localStorage方便調用
  localStorage.setItem("currentPage", page);
  //更新畫面，此處判斷目前panal中為清單或是卡片模式
  let findCard = document.querySelector(".card-title");
  let findList = document.querySelector(".list-title");
  if (findCard) {
    renderMovieList(getMoviesByPage(page));
  } else if (findList) {
    renderListView(getMoviesByPage(page));
  }
});

//監聽list view & card view
const viewButtons = document.querySelector("#view-buttons");
viewButtons.addEventListener("click", function toggleView(event) {
  event.preventDefault();
  let findCard = document.querySelector(".card-title");
  let findList = document.querySelector(".list-title");
  let getCurrentPage = Number(localStorage.getItem("currentPage"));
  if (event.target.matches("#card-view-button")) {
    if (findCard) {
      return;
    } else {
      renderMovieList(getMoviesByPage(getCurrentPage));
    }
  } else if (event.target.matches("#list-view-button")) {
    if (findList) {
      return;
    } else {
      renderListView(getMoviesByPage(getCurrentPage));
    }
  }
});
