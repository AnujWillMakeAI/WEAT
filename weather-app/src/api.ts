export interface WeatherData {
  current: {
    temp: number;
    condition: string;
    weatherCode: number;
    humidity: number;
    wind: number;
    uv: number;
    feelsLike: number;
    aqi: number;
    sunrise: string;
    sunset: string;
  };
  forecast: {
    day: string;
    tempMax: number;
    tempMin: number;
    condition: string;
    weatherCode: number;
  }[];
  hourly: {
    time: string;
    temp: number;
    condition: string;
    weatherCode: number;
    precipProb: number;
  }[];
  alerts: string[];
}

export interface Location {
  name: string;
  country: string;
  admin1?: string;
  lat: number;
  lon: number;
}

export const searchCity = async (query: string): Promise<Location[]> => {
  if (!query) return [];
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
    const data = await res.json();
    if (!data.results) return [];
    return data.results.map((r: any) => ({
      name: r.name,
      country: r.country,
      admin1: r.admin1,
      lat: r.latitude,
      lon: r.longitude
    }));
  } catch (error) {
    console.error("Geocoding API error:", error);
    return [];
  }
};

export const reverseGeocode = async (lat: number, lon: number): Promise<Location | null> => {
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    const data = await res.json();
    return {
      name: data.city || data.locality || "Current Location",
      country: data.countryCode || "",
      lat,
      lon
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
};

export const getWeatherCondition = (code: number) => {
  // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
  if (code === 0) return 'Clear';
  if (code === 1 || code === 2 || code === 3) return 'Cloudy';
  if (code >= 45 && code <= 48) return 'Fog';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'Rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'Snow';
  if (code >= 95) return 'Storm';
  return 'Unknown';
};

export const getWeatherTheme = (condition: string): string => {
  if (condition === 'Clear') return 'theme-sun';
  if (condition === 'Rain' || condition === 'Storm') return 'theme-rain';
  if (condition === 'Cloudy' || condition === 'Fog') return 'theme-cloudy';
  if (condition === 'Snow') return 'theme-rain'; 
  return 'theme-sun';
};

export const getWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  const [weatherRes, aqiRes] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset&timezone=auto`),
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi`).catch(() => null)
  ]);
  
  const data = await weatherRes.json();
  const aqiData = aqiRes ? await aqiRes.json().catch(() => null) : null;

  const currentCode = data.current.weather_code;
  const currentCondition = getWeatherCondition(currentCode);

  const forecast = data.daily.time.slice(1, 6).map((timeStr: string, index: number) => {
    const d = new Date(timeStr);
    const day = d.toLocaleDateString('en-US', { weekday: 'short' });
    return {
      day,
      tempMax: Math.round(data.daily.temperature_2m_max[index + 1]),
      tempMin: Math.round(data.daily.temperature_2m_min[index + 1]),
      condition: getWeatherCondition(data.daily.weather_code[index + 1]),
      weatherCode: data.daily.weather_code[index + 1]
    };
  });

  // Format sunrise and sunset
  const sunriseDate = new Date(data.daily.sunrise[0]);
  const sunsetDate = new Date(data.daily.sunset[0]);
  const sunrise = sunriseDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const sunset = sunsetDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const currentHourString = data.current.time.slice(0, 13) + ":00";
  let currentHourIndex = data.hourly.time.findIndex((t: string) => t.startsWith(currentHourString.slice(0, 13)));
  if (currentHourIndex === -1) currentHourIndex = 0;

  const hourly = data.hourly.time.slice(currentHourIndex, currentHourIndex + 24).map((timeStr: string, index: number) => {
    const d = new Date(timeStr);
    return {
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
      temp: Math.round(data.hourly.temperature_2m[currentHourIndex + index]),
      condition: getWeatherCondition(data.hourly.weather_code[currentHourIndex + index]),
      weatherCode: data.hourly.weather_code[currentHourIndex + index],
      precipProb: data.hourly.precipitation_probability[currentHourIndex + index] || 0
    };
  });

  const aqi = aqiData?.current?.european_aqi || 0;
  const temp = Math.round(data.current.temperature_2m);
  const wind = Math.round(data.current.wind_speed_10m);

  const alerts: string[] = [];
  if (temp > 35) alerts.push("Extreme Heat Warning");
  if (temp < -5) alerts.push("Extreme Cold Warning");
  if (wind > 50) alerts.push("High Wind Warning");
  if (currentCode >= 95) alerts.push("Severe Thunderstorm Warning");
  if (aqi > 80) alerts.push("Unhealthy Air Quality");

  return {
    current: {
      temp,
      condition: currentCondition,
      weatherCode: currentCode,
      humidity: data.current.relative_humidity_2m,
      wind,
      uv: data.daily.uv_index_max ? Math.round(data.daily.uv_index_max[0]) : 0,
      feelsLike: Math.round(data.current.apparent_temperature),
      aqi,
      sunrise,
      sunset
    },
    forecast,
    hourly,
    alerts
  };
};

export const getBasicWeather = async (lat: number, lon: number): Promise<{ temp: number, condition: string }> => {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
    const data = await res.json();
    return {
      temp: Math.round(data.current.temperature_2m),
      condition: getWeatherCondition(data.current.weather_code)
    };
  } catch (error) {
    console.error("Basic weather fetch error:", error);
    return { temp: 0, condition: 'Unknown' };
  }
};

export const getCityImage = async (cityName: string): Promise<string | null> => {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cityName)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.originalimage && data.originalimage.source) {
      return data.originalimage.source;
    }
    return null;
  } catch (error) {
    console.error("Error fetching city image:", error);
    return null;
  }
};
