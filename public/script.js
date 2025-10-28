// openweathermap api -> username: sahilkhatik786, password: Sahil@1705
const cityName = document.querySelector('#city-name');
const temperature = document.querySelector('#temperature')
const humidity = document.querySelector('#humidity');
const windSpeed = document.querySelector('#wind-speed');
const forecastContainer = document.querySelector('#forecast-container');
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const loaderEL = document.querySelector('#loader');
const errorContainer = document.querySelector('#error-container');
const historyContainer = document.querySelector('#history-container');

function updateWeatherBackground(weatherMain) {
  const body = document.body;
  body.className = ""; // clear previous state

  const weather = weatherMain.toLowerCase();

  if (weather.includes("rain")) {
    body.classList.add("rain-bg");
  } else if (weather.includes("cloud")) {
    body.classList.add("clouds-bg");
  } else if (weather.includes("snow")) {
    body.classList.add("snow-bg");
  } else if (weather.includes("clear")) {
    body.classList.add("clear-bg");
  } else if (weather.includes("night")) {
    body.classList.add("night-bg");
  } else {
    body.classList.add("default-bg");
  }
}


// This function is responsible for taking the weather data object and updating the UI.
function displayCurrentWeather(data) {
    const currentDate = new Date().toLocaleDateString();
    cityName.textContent = `${data.name} (${currentDate})`;
    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    temperature.innerHTML = `Temperature: ${Math.round(data.main.temp)} °C <img src="${iconUrl}" alt="${data.weather[0].description}" style="vertical-align:middle;">`;
    humidity.textContent = `Humidity: ${data.main.humidity} %`;
    windSpeed.textContent = `Wind-Speed: ${data.wind.speed} m/s`;

    updateWeatherBackground(data.weather[0].main);
}

// Reads the search history from localStorage and renders it as buttons on the page.
function renderHistory() {
  const history = JSON.parse(localStorage.getItem('weatherHistory') || '[]');
  historyContainer.innerHTML = "";

  const visibleHistory = history.slice(0, 5);

  for(const city of visibleHistory) {
    const historyBtn = document.createElement('button')
    historyBtn.textContent = city;
    historyBtn.classList.add("history-btn");
    historyBtn.setAttribute('data-city', city);
    historyContainer.append(historyBtn);
  }

  if(history.length > 5) {
    const moreBtn = document.createElement('button');
    moreBtn.textContent = `View All (${history.length})`;
    moreBtn.classList.add('more-btn');
    moreBtn.addEventListener("click", () => {
      const allCities = history.join('\n');
      window.alert(`Search History:\n\n${allCities}`);
    });
    historyContainer.append(moreBtn);
  }
}

/**
 * Saves a city to the search history in localStorage.
 * @param {string} city The city name to save.
 */
function saveCityToHistory(city) {
  const historyStr = localStorage.getItem('weatherHistory') || '[]';

  let history = JSON.parse(historyStr);
  history = history.filter(existingCity => existingCity.toLowerCase() !== city.toLowerCase());
  history.unshift(city);

  if(history.length > 10) {
    history = history.slice(0, 10);
  }

  localStorage.setItem('weatherHistory', JSON.stringify(history));

  renderHistory();
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const city = searchInput.value.trim();
  if(city) {
    fetchWeather(city);
    searchInput.value = "";
  } else {
    console.log("Input is empty. Please enter a city name.");
  }
});

historyContainer.addEventListener('click', (event) => {
  // 1. Check if the element that was clicked is actually one of our history buttons.
  // The .matches() method checks if the element would be selected by the given CSS selector.
  if(event.target.matches('.history-btn')) {
    // 2. If it is a button, get the city name from the `data-city` attribute.
    // The `dataset` property provides easy access to all `data-*` attributes.
    // `event.target.dataset.city` corresponds to `data-city="..."`.
    const city = event.target.dataset.city;
    fetchWeather(city);
  }
});

renderHistory();

// This function is responsible for creating and displaying the 5-day forecast cards.
function displayForecast(forecastList) {
  forecastContainer.innerHTML = "";

  for(let i = 0; i < forecastList.length; i += 8) {
    const dailyForecast = forecastList[i];

    const card = document.createElement('div');
    card.classList.add('forecast-card');

    // 1. Create the date element (h3).
    // The API gives us a `dt_txt` field (e.g., "2023-10-27 12:00:00").
    // We create a new Date object from it and use toLocaleDateString() for a friendly format.
    const date = new Date(dailyForecast.dt_txt);
    const dateEL = document.createElement('h3');
    dateEL.textContent = date.toLocaleDateString();

    // 2. Create the weather icon element (img).
    // The API provides an icon code in `dailyForecast.weather[0].icon`.
    // We use this to build the full URL to the weather icon image.
    const iconCode = dailyForecast.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    const iconEL = document.createElement('img');
    iconEL.setAttribute('src', iconUrl);
    // CRITICAL for accessibility: The alt attribute describes the image for screen readers
    // or if the image fails to load.
    iconEL.setAttribute('alt', dailyForecast.weather[0].description);

    // 3. Create the temperature element (p).
    // We round the temperature and add the unit symbol.
    const tempEL = document.createElement('p');
    tempEL.textContent = `Temp: ${Math.round(dailyForecast.main.temp)} °C`;

    // 4. Create the humidity element (p).
    const humidityEL = document.createElement('p');
    humidityEL.textContent = `Humidity: ${dailyForecast.main.humidity}%`;

    // 5. Append all the newly created child elements to the parent `card` div.
    // The `.append()` method can take multiple elements at once.
    card.append(dateEL, iconEL, tempEL, humidityEL);
    // console.log(card);

    forecastContainer.append(card);
  }
}

async function fetchWeather(city) {
  try {
    // 1. Hide any previous error messages.
    errorContainer.classList.add("hidden");

    // 2. Clear out the previous weather data.
    cityName.textContent = "";
    temperature.textContent = "";
    humidity.textContent = "";
    windSpeed.textContent = "";
    forecastContainer.innerHTML = "";

    loaderEL.classList.remove("hidden");

    const response = await fetch(`/api/weather/${city}`);

    if(!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'An unknown error occurred.');
    }

    // for(const response of responses) {
    //   if (!response.ok) {
    //     throw new Error("Request failed: ${response.status} ${response.statusText}");
    //   }
    // }

    const { currentWeather, forecast } = await response.json();

    displayCurrentWeather(currentWeather);
    displayForecast(forecast.list);
    saveCityToHistory(currentWeather.name);

  } catch (err) {
    console.error("Failed to fetch weather data:", err);
    errorContainer.textContent = err.message;
    errorContainer.classList.remove("hidden");
  } finally {
    loaderEL.classList.add("hidden");
  }
}

// fetchWeather("London");

async function fetchWeatherByCoords(lat, lon) {
  try {
    // 1. Hide any previous error messages.
    errorContainer.classList.add("hidden");

    // 2. Clear out the previous weather data.
    cityName.textContent = "";
    temperature.textContent = "";
    humidity.textContent = "";
    windSpeed.textContent = "";
    forecastContainer.innerHTML = "";

    loaderEL.classList.remove("hidden");

    // 3. Construct URLs using latitude and longitude
    // const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    // const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    // 4. Fetch both endpoints concurrently
    const response = await fetch(`/api/weather/coords?lat=${lat}&lon=${lon}`);

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'An unknown error occurred.');
    }

    const { currentWeather, forecast } = await response.json();

    // 5. Display results using the same UI functions
    displayCurrentWeather(currentWeather);
    displayForecast(forecast.list);

    // 6. Save the city name to history
    saveCityToHistory(currentWeather.name);

  } catch (err) {
    console.error("Failed to fetch weather data by coordinates:", err);
    errorContainer.textContent = 'Could not fetch weather for your location. ' + err.message;
    errorContainer.classList.remove("hidden");
  } finally {
    loaderEL.classList.add("hidden");
  }
}


// We check if the `geolocation` property exists on the `navigator` object.
// This is our feature detection step.
if(navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    // This function will run ONLY if the user clicks "Allow".
    // It automatically receives a 'position' object as an argument.
    (position) => {
      // The position object contains the geographic coordinates.
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      fetchWeatherByCoords(latitude, longitude);
    },
    // This function will run ONLY if the user clicks "Block" or an error occurs.
    // It automatically receives an 'error' object as an argument.
    (error) => {
      console.error("Error getting user location:", error.message);
    }
  );
} else {
  console.log("Geolocation is not available on this browser!")
}

searchForm.addEventListener('submit', (event) => {
  // The first and most important thing to do in a form submission handler
  // for a Single-Page App (SPA) is to prevent the browser's default behavior,
  // which is to reload the page.
  event.preventDefault();
  const city = searchInput.value.trim();

  if(city){
    // console.log(`Input is valid. Ready to fetch weather for ${city}. `);
    fetchWeather(city);
    searchInput.value = "";
  } else {
    console.log("Input is empty. Please enter city name.");
  }
});

window.addEventListener('load', () => {
  searchInput.focus();
});