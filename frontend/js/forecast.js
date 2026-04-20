let user = document.querySelector("#uname");
let username = localStorage.getItem("uname");

if (user) {
    user.textContent = username || "Guest";
}
const apiKey = "85e24fbc730d141f1608cd28e13d5c71";
const city = localStorage.getItem("selectedCity");

if (!city) {
    alert("No city selected. Please search weather first.");
    window.location.href = "weather.html";
}

document.getElementById("cityTitle").innerText = `${city} – 5 Day Forecast`;

async function loadForecast() {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    const grid = document.getElementById("forecastGrid");
    grid.innerHTML = "";

    // One forecast per day (every 24 hours)
    for (let i = 0; i < data.list.length; i += 8) {
        const item = data.list[i];
        const date = new Date(item.dt_txt).toDateString();
        const temp = item.main.temp;
        const weather = item.weather[0].main;

        let icon = "🌤";
        if (weather.includes("Rain")) icon = "🌧";
        if (weather.includes("Cloud")) icon = "☁️";
        if (weather.includes("Clear")) icon = "☀️";
        if (weather.includes("Storm")) icon = "⛈";
        if (weather.includes("Snow")) icon = "❄️";

        grid.innerHTML += `
            <div class="col-md-4 col-lg-2 col-6">
                <div class="forecast-card">
                    <div class="date">${date.split(" ")[0]}</div>
                    <div class="forecast-icon">${icon}</div>
                    <div class="temp">${temp}°C</div>
                    <div class="desc">${weather}</div>
                </div>
            </div>
        `;
    }
}

loadForecast();
