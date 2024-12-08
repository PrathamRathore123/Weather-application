require('dotenv').config();

const http = require("http");
const fs = require("fs");
const url = require('url');
var requests = require("requests");

const homeFile = fs.readFileSync("home.html", "utf-8");

const replaceVal = (tempVal, orgVal) => {
  let temperature = tempVal.replace("{%tempval%}", orgVal.main.temp);
  temperature = temperature.replace("{%tempmin%}", orgVal.main.temp_min);
  temperature = temperature.replace("{%tempmax%}", orgVal.main.temp_max);
  temperature = temperature.replace("{%location%}", orgVal.name);
  temperature = temperature.replace("{%country%}", orgVal.sys.country);
  temperature = temperature.replace("{%tempstatus%}", orgVal.weather[0].main);

  return temperature;
};

const server = http.createServer((req, res) => {
  const queryObject = url.parse(req.url, true).query;
  const cities = queryObject.city ? queryObject.city.split(',') : ['Pune']; // Default to Pune if no city is provided

  if (req.url.startsWith("/")) {
    let weatherData = '';
    let requestsCount = 0;

    cities.forEach(city => {
      requests(
        `http://api.openweathermap.org/data/2.5/weather?q=${city.trim()}&units=metric&appid=${process.env.APPID}`
      )
      .on("data", (chunk) => {
        const objdata = JSON.parse(chunk);
        if (objdata.cod !== 200) {
          weatherData += `<div>Error: ${objdata.message} for ${city.trim()}</div>`;
        } else {
          const arrData = [objdata];
          weatherData += arrData.map((val) => replaceVal(homeFile, val)).join("");
        }
      })
      .on("error", (err) => {
        console.log("Request error: ", err);
        weatherData += `<div>Error fetching data for ${city.trim()}</div>`;
      })
      .on("end", (err) => {
        requestsCount++;
        if (err) {
          console.log("Connection closed due to errors", err);
        }
        if (requestsCount === cities.length) {
          res.write(weatherData);
          res.end();
        }
      });
    });
  } else {
    res.end("File not found");
  }
});

server.listen(8000, "127.0.0.1");