import { WeatherData } from './api';

export const getRecommendations = (weather: WeatherData | null) => {
  if (!weather) return { base: [], outerwear: [], bottoms: [], footwear: [], accessories: [], activities: [] };
  
  const { temp, condition, wind, uv, aqi } = weather.current;
  
  const base: string[] = [];
  const outerwear: string[] = [];
  const bottoms: string[] = [];
  const footwear: string[] = [];
  const accessories: string[] = [];
  const activities: string[] = [];

  // Base Layer
  if (temp >= 28) {
    base.push("👕 Linen Shirt", "👕 T-Shirt", "🎽 Tank Top");
  } else if (temp >= 20) {
    base.push("👕 Short-sleeve Shirt", "👕 T-Shirt", "👚 Blouse");
  } else if (temp >= 10) {
    base.push("👕 Long-sleeve Shirt", "👔 Button-up", "👕 T-Shirt");
  } else if (temp >= 0) {
    base.push("👕 Thermal Shirt", "👕 Long-sleeve Shirt");
  } else {
    base.push("👕 Heavy Thermal", "🧶 Thick Wool Sweater");
  }

  // Outerwear
  if (temp < 10) {
    outerwear.push("🧥 Heavy Winter Coat", "🧥 Puffer Jacket");
  } else if (temp < 15) {
    outerwear.push("🧥 Light Coat", "🧶 Cardigan", "🧥 Denim Jacket");
  } else if (temp < 20) {
    outerwear.push("🧥 Light Jacket (optional)", "🧶 Sweater");
  }

  // Bottoms
  if (temp >= 25) {
    bottoms.push("🩳 Shorts", "🩳 Linen Pants", "👗 Skirt");
  } else if (temp >= 15) {
    bottoms.push("👖 Light Jeans", "👖 Chinos", "🩳 Long Shorts");
  } else if (temp >= 0) {
    bottoms.push("👖 Heavy Jeans", "👖 Trousers");
  } else {
    bottoms.push("👖 Thermal Pants", "👖 Lined Jeans");
  }

  // Footwear
  if (condition === 'Snow') {
    footwear.push("👢 Snow Boots", "🥾 Waterproof Boots");
  } else if (condition === 'Rain' || condition === 'Storm') {
    footwear.push("👢 Rain Boots", "👟 Waterproof Sneakers");
  } else if (temp >= 25) {
    footwear.push("🩴 Sandals", "👟 Breathable Sneakers");
  } else if (temp >= 15) {
    footwear.push("👟 Sneakers", "👞 Loafers");
  } else {
    footwear.push("👢 Boots", "👟 Warm Sneakers");
  }

  // Accessories
  if (uv > 5 || condition === 'Clear') {
    accessories.push("🕶️ Sunglasses", "🧴 Sunscreen", "🧢 Cap/Hat");
  }

  if (condition === 'Rain' || condition === 'Storm') {
    accessories.push("☂️ Umbrella", "🌧️ Raincoat");
  }

  if (temp < 10) {
    accessories.push("🧣 Warm Scarf", "🧤 Winter Gloves", "🧥 Beanie");
  }

  if (wind > 25) {
    outerwear.push("🧥 Windbreaker");
    const index = accessories.indexOf("☂️ Umbrella");
    if (index !== -1) accessories.splice(index, 1);
  }

  if (aqi > 80) {
    accessories.push("😷 Face Mask (Poor Air Quality)");
  }

  // Activity Recommendations
  if (aqi > 100) {
    activities.push("Indoor activities only (Unhealthy Air)", "Reading", "Home Workout", "Movies");
  } else if (condition === 'Storm' || condition === 'Rain') {
    activities.push("Museum visit", "Coffee shop reading", "Indoor bouldering", "Movie marathon");
  } else if (condition === 'Snow') {
    activities.push("Skiing / Snowboarding", "Ice skating", "Building a snowman", "Cozying by the fire");
  } else if (temp >= 20 && temp <= 30 && condition === 'Clear') {
    activities.push("Hiking", "Beach / Swimming", "Picnic in the park", "Outdoor dining");
  } else if (temp > 30) {
    activities.push("Swimming", "Indoor mall walking", "Going to the cinema", "Staying hydrated indoors");
  } else if (temp >= 10 && temp < 20) {
    activities.push("Brisk walking", "Cycling", "Visiting an outdoor market", "Light jogging");
  } else {
    activities.push("Photography", "Visiting local cafes", "Indoor shopping");
  }

  // Deduplicate and return
  return { 
    base: [...new Set(base)], 
    outerwear: [...new Set(outerwear)], 
    bottoms: [...new Set(bottoms)], 
    footwear: [...new Set(footwear)], 
    accessories: [...new Set(accessories)],
    activities: [...new Set(activities)]
  };
}
