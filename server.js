require('dotenv').config();
const express = require('express');
const port = process.env.PORT || 3000;
const app = express();

app.use(express.static('public'));

app.get("/api/weather/coords", async (req, res) => {
    try {
        const { lat, lon } = req.query;
        const { API_KEY } = process.env;

        if(!lat || !lon) {
            return res.status(400).json({
                error: "Latitude and Longitude are required!",
            });
        }
        if(!API_KEY) {
            throw new Error("Server configuration error: API key is missing");
        }

        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

        const [currentWeatherResponse, forecastResponse] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastUrl),
        ]);

        if(!currentWeatherResponse.ok || !forecastResponse.ok) {
            throw new Error("Could not fetch weather for the providing coordinates.");
        }

        const currentWeather = await currentWeatherResponse.json();
        const forecast = await forecastResponse.json();

        res.json({ currentWeather, forecast });
    } catch(error) {
        console.error("Error fetching weather data by coords:", error.message);
        res.status(500).json({ error: "Failed to fetch weather data." + error.message});
    }
});

app.get("/api/weather/:city", async (req, res) => {
    try {
        const { city } = req.params;
        const { API_KEY } = process.env;

        if(!API_KEY) {
            throw new Error("Server configurtion error: API key is missing.");
        }

        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;

        const [currentWeatherResponse, forecastResponse] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastUrl),
        ]);

        if(!currentWeatherResponse.ok || !forecastResponse.ok) {
            throw new Error("City not found or API error.");
        }

        const currentWeather = await currentWeatherResponse.json();
        const forecast = await forecastResponse.json();

        res.json({ currentWeather, forecast });
    } catch(err) {
        res.status(500).json({
            error: 'Failed to fetch weather data. ' + err.message
        });
    }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server was listening port: ${port}`);
});