export interface TravelDestination {
  name: string;
  country: string;
  lat: number;
  lon: number;
  type: 'warm' | 'cool';
  emoji: string;
  description: string;
}

export const curatedDestinations: TravelDestination[] = [
  // Warm / Tropical Escapes
  { name: 'Bali', country: 'Indonesia', lat: -8.4095, lon: 115.1889, type: 'warm', emoji: '🌴', description: 'Tropical paradise with rich culture.' },
  { name: 'Amalfi Coast', country: 'Italy', lat: 40.6333, lon: 14.6029, type: 'warm', emoji: '🍋', description: 'Stunning cliffs and turquoise waters.' },
  { name: 'Santorini', country: 'Greece', lat: 36.3932, lon: 25.4615, type: 'warm', emoji: '🌊', description: 'Iconic sunsets and white architecture.' },
  { name: 'Tulum', country: 'Mexico', lat: 20.2114, lon: -87.4654, type: 'warm', emoji: '🍹', description: 'Boho-chic beaches and ancient ruins.' },
  { name: 'Maldives', country: 'Maldives', lat: 3.2028, lon: 73.2207, type: 'warm', emoji: '🏝️', description: 'Ultimate luxury and clear lagoons.' },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708, type: 'warm', emoji: '🐪', description: 'Futuristic cityscapes and desert heat.' },
  
  // Cool / Cozy / Winter Escapes
  { name: 'Zermatt', country: 'Switzerland', lat: 46.0207, lon: 7.7491, type: 'cool', emoji: '🏔️', description: 'Cozy chalets near the Matterhorn.' },
  { name: 'Reykjavik', country: 'Iceland', lat: 64.1466, lon: -21.9426, type: 'cool', emoji: '❄️', description: 'Geothermal spas and northern lights.' },
  { name: 'Kyoto', country: 'Japan', lat: 35.0116, lon: 135.7681, type: 'cool', emoji: '⛩️', description: 'Historic temples and tranquil gardens.' },
  { name: 'Banff', country: 'Canada', lat: 51.1784, lon: -115.5708, type: 'cool', emoji: '🌲', description: 'Breathtaking rocky mountain scenery.' },
  { name: 'Patagonia', country: 'Argentina', lat: -50.3370, lon: -72.2653, type: 'cool', emoji: '🧊', description: 'Glaciers and extreme wilderness.' },
  { name: 'Oslo', country: 'Norway', lat: 59.9139, lon: 10.7522, type: 'cool', emoji: '🧣', description: 'Scandinavian design and fjords.' },
];
