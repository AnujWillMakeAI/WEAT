import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Wind, Droplets, Sun, Cloud, CloudRain, Thermometer, ArrowRight, Loader2, CloudLightning, Snowflake, Navigation, Sunrise, Sunset, Activity, AlertTriangle, Plane, Star, X } from 'lucide-react'
import { searchCity, getWeather, getWeatherTheme, reverseGeocode, getBasicWeather, WeatherData, Location, getCityImage } from './api'
import { getRecommendations } from './recommendations'
import { curatedDestinations, TravelDestination } from './destinations'

const WeatherIcon = ({ condition, size = 24, className = '' }: { condition: string, size?: number, className?: string }) => {
  switch (condition) {
    case 'Clear': return <Sun size={size} className={className} />;
    case 'Cloudy':
    case 'Fog': return <Cloud size={size} className={className} />;
    case 'Rain': return <CloudRain size={size} className={className} />;
    case 'Snow': return <Snowflake size={size} className={className} />;
    case 'Storm': return <CloudLightning size={size} className={className} />;
    default: return <Sun size={size} className={className} />;
  }
}

interface EscapeData {
  destination: TravelDestination;
  temp: number;
  condition: string;
}

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [cityImage, setCityImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Search state
  const [suggestions, setSuggestions] = useState<Location[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const [escapes, setEscapes] = useState<EscapeData[]>([])
  
  const [savedLocations, setSavedLocations] = useState<Location[]>(() => {
    const saved = localStorage.getItem('weatherEscapeBookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    let defaultLoaded = false;
    if ("geolocation" in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'granted') {
          handleLocateMe();
          defaultLoaded = true;
        } else if (result.state === 'prompt') {
          fetchWeatherForLocation({ lat: 37.9838, lon: 23.7278, name: 'Athens', country: 'GR' });
        } else {
          fetchWeatherForLocation({ lat: 37.9838, lon: 23.7278, name: 'Athens', country: 'GR' });
        }
      });
    } else {
      fetchWeatherForLocation({ lat: 37.9838, lon: 23.7278, name: 'Athens', country: 'GR' });
    }
  }, []);

  useEffect(() => {
    if (weatherData) {
      document.body.className = getWeatherTheme(weatherData.current.condition);
    }
  }, [weatherData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        setShowSuggestions(true);
        const locations = await searchCity(searchQuery);
        setSuggestions(locations);
        setFocusedSuggestionIndex(-1);
        setIsSearching(false);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsSearching(false);
        setFocusedSuggestionIndex(-1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedSuggestionIndex >= 0 && focusedSuggestionIndex < suggestions.length) {
        handleSuggestionClick(suggestions[focusedSuggestionIndex]);
      } else {
        if (suggestions.length > 0) {
          handleSuggestionClick(suggestions[0]);
        }
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setFocusedSuggestionIndex(-1);
  };

  const fetchWeatherForLocation = async (loc: Location) => {
    setLoading(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const data = await getWeather(loc.lat, loc.lon);
      setWeatherData(data);
      setCurrentLocation(loc);

      const targetType = data.current.temp < 18 ? 'warm' : 'cool';
      const filteredDestinations = curatedDestinations.filter(d => d.type === targetType && d.name !== loc.name);
      
      const shuffled = [...filteredDestinations].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 2);

      const escapeData = await Promise.all(
        selected.map(async (dest) => {
          const basicWeather = await getBasicWeather(dest.lat, dest.lon);
          return {
            destination: dest,
            temp: basicWeather.temp,
            condition: basicWeather.condition
          };
        })
      );
      setEscapes(escapeData);

      const image = await getCityImage(loc.name);
      setCityImage(image);

    } catch (err) {
      setError('Failed to fetch weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = async (loc: Location) => {
    setShowSuggestions(false);
    setSearchQuery('');
    await fetchWeatherForLocation(loc);
  }

  const handleLocateMe = () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const loc = await reverseGeocode(latitude, longitude);
        if (loc) {
          await fetchWeatherForLocation(loc);
        } else {
          await fetchWeatherForLocation({ name: 'Current Location', country: '', lat: latitude, lon: longitude });
        }
      },
      (err) => {
        console.error(err);
        setError("Could not get your location. Please check permissions.");
        setLoading(false);
      }
    );
  }

  const toggleBookmark = () => {
    if (!currentLocation) return;
    
    const isSaved = savedLocations.some(l => l.name === currentLocation.name && l.lat === currentLocation.lat);
    let newSaved;
    
    if (isSaved) {
      newSaved = savedLocations.filter(l => !(l.name === currentLocation.name && l.lat === currentLocation.lat));
    } else {
      newSaved = [...savedLocations, currentLocation];
    }
    
    setSavedLocations(newSaved);
    localStorage.setItem('weatherEscapeBookmarks', JSON.stringify(newSaved));
  };

  const recommendations = getRecommendations(weatherData);

  const renderClothingPills = (items: string[]) => (
    <ul style={{ listStyle: 'none', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {items.map((item, i) => (
        <li key={i} style={{ 
          padding: '0.4rem 1rem', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', 
          fontSize: '0.875rem', color: 'var(--text-primary)',
          fontWeight: 500, border: '1px solid rgba(255,255,255,0.05)'
        }}>
          {item}
        </li>
      ))}
    </ul>
  );

  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return '#34C759'; // iOS Green
    if (aqi <= 100) return '#FFCC00'; // iOS Yellow
    if (aqi <= 150) return '#FF9500'; // iOS Orange
    if (aqi <= 200) return '#FF3B30'; // iOS Red
    return '#AF52DE'; // iOS Purple
  };

  const getAqiLabel = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Poor';
    return 'Unhealthy';
  }

  const getUvAdvice = (uv: number) => {
    if (uv < 3) return { burnTime: "Safe", spf: "No protection needed" };
    if (uv < 6) return { burnTime: "Burn in 45m", spf: "SPF 30 recommended" };
    if (uv < 8) return { burnTime: "Burn in 30m", spf: "SPF 30+ required" };
    if (uv < 11) return { burnTime: "Burn in 15m", spf: "SPF 50+ required" };
    return { burnTime: "Burn < 10m", spf: "SPF 50+ & avoid sun" };
  }

  const isCurrentLocationSaved = currentLocation && savedLocations.some(l => l.name === currentLocation.name && l.lat === currentLocation.lat);

  return (
    <div className="app-container">
      {/* Header & Search */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 50 }} className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.03em', opacity: 0.4 }}>WEAT</span>
            <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 0.25rem' }}>|</span>
            <MapPin size={20} className="text-secondary" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
              {currentLocation ? `${currentLocation.name}${currentLocation.admin1 ? `, ${currentLocation.admin1}` : ''}${currentLocation.country ? `, ${currentLocation.country}` : ''}` : ''}
            </h1>
            {currentLocation && (
              <button 
                onClick={toggleBookmark}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: '0.5rem', display: 'flex' }}
                title={isCurrentLocationSaved ? "Remove Bookmark" : "Save Location"}
              >
                <Star size={20} fill={isCurrentLocationSaved ? 'var(--text-primary)' : 'none'} color={isCurrentLocationSaved ? 'var(--text-primary)' : 'var(--text-secondary)'} style={{ transition: 'all 0.2s' }} />
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              onClick={handleLocateMe}
              className="glass-panel interactive"
              style={{ 
                padding: '0.6rem', borderRadius: '50%', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)'
              }}
              title="Auto-detect location"
            >
              <Navigation size={18} />
            </button>

            <div ref={searchContainerRef} style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', borderRadius: '24px', width: '300px', maxWidth: '100%' }}>
                {isSearching ? <Loader2 size={18} className="text-secondary animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={18} className="text-secondary" />}
                <input 
                  type="text" 
                  placeholder="Search city..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => { if (searchQuery.trim().length >= 2) setShowSuggestions(true) }}
                  style={{ 
                    background: 'transparent', border: 'none', outline: 'none', 
                    color: 'inherit', padding: '0.25rem 0.5rem', width: '100%',
                    fontFamily: 'inherit', fontSize: '0.9rem'
                  }}
                />
                {searchQuery && (
                  <button onClick={clearSearch} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', padding: '2px', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
              
              {showSuggestions && searchQuery.trim().length >= 2 && (
                <div className="glass-panel" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '300px', overflowY: 'auto', zIndex: 9999 }}>
                  {isSearching && suggestions.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Searching...</div>
                  ) : !isSearching && suggestions.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No locations found</div>
                  ) : (
                    suggestions.map((loc, i) => (
                      <button
                        key={`${loc.lat}-${loc.lon}-${i}`}
                        type="button"
                        onClick={() => handleSuggestionClick(loc)}
                        style={{
                          padding: '0.75rem 1rem', border: 'none',
                          borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          textAlign: 'left', color: 'inherit', fontFamily: 'inherit',
                          fontSize: '0.875rem', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s',
                          background: focusedSuggestionIndex === i ? 'rgba(255,255,255,0.1)' : 'transparent'
                        }}
                        onMouseOver={() => setFocusedSuggestionIndex(i)}
                      >
                        <MapPin size={16} className="text-secondary" style={{ flexShrink: 0 }} />
                        <span style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500 }}>{loc.name}</span>
                          <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                            {loc.admin1 ? `${loc.admin1}, ` : ''}{loc.country}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
              {error && <span style={{ color: '#FF3B30', fontSize: '0.875rem', position: 'absolute', top: 'calc(100% + 0.5rem)' }}>{error}</span>}
            </div>
          </div>
        </div>

        {/* Bookmarks Row */}
        {savedLocations.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
            {savedLocations.map((loc, i) => (
              <button
                key={i}
                onClick={() => fetchWeatherForLocation(loc)}
                className="glass-panel interactive"
                style={{ 
                  padding: '0.4rem 0.8rem', borderRadius: '16px',
                  display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', whiteSpace: 'nowrap',
                  color: 'inherit', background: currentLocation?.name === loc.name ? 'rgba(255,255,255,0.15)' : 'var(--glass-bg)'
                }}
              >
                <Star size={12} fill="var(--text-primary)" color="var(--text-primary)" />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{loc.name}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Severe Weather Alerts Banner */}
      {weatherData && weatherData.alerts.length > 0 && (
        <div className="animate-fade-in" style={{
          background: 'rgba(255, 59, 48, 0.15)', border: '1px solid rgba(255, 59, 48, 0.2)',
          borderRadius: '16px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', color: '#FF453A', marginTop: '1rem'
        }}>
          <AlertTriangle size={20} />
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '0.1rem', letterSpacing: '-0.01em' }}>Severe Weather Alert</h4>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255, 69, 58, 0.8)' }}>{weatherData.alerts.join(' • ')}</p>
          </div>
        </div>
      )}

      {loading && !weatherData ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Loader2 size={32} className="text-secondary" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : weatherData ? (
        <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
          
          {/* Main Temperature Display (Ultra Minimalist) */}
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 0 3rem 0', animationDelay: '0.1s' }}>
            <h2 style={{ fontSize: '8rem', fontWeight: 200, lineHeight: 1, letterSpacing: '-0.05em', margin: 0 }}>
              {weatherData.current.temp}°
            </h2>
            <p style={{ fontSize: '1.5rem', fontWeight: 400, letterSpacing: '-0.02em', marginTop: '0.5rem' }} className="text-secondary">
              {weatherData.current.condition}
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: 500 }}>
              <span>H:{weatherData.forecast[0].tempMax}°</span>
              <span className="text-secondary">L:{weatherData.forecast[0].tempMin}°</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* Left Column: Data Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Widgets Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="glass-panel animate-fade-in" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', aspectRatio: '1', animationDelay: '0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.02em' }}>
                    <Thermometer size={16} /> UV INDEX
                  </div>
                  <div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 400, lineHeight: 1 }}>{weatherData.current.uv}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 500, marginTop: '0.25rem' }}>{getUvAdvice(weatherData.current.uv).burnTime}</div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{getUvAdvice(weatherData.current.uv).spf}</div>
                </div>

                <div className="glass-panel animate-fade-in" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', aspectRatio: '1', animationDelay: '0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.02em' }}>
                    <Wind size={16} /> AIR QUALITY
                  </div>
                  <div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 400, lineHeight: 1, color: getAqiColor(weatherData.current.aqi) }}>{weatherData.current.aqi}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 500, color: getAqiColor(weatherData.current.aqi), marginTop: '0.25rem' }}>{getAqiLabel(weatherData.current.aqi)}</div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Similar to yesterday.</div>
                </div>
              </div>

              {/* Sun & Wind Wide Widget */}
              <div className="glass-panel animate-fade-in" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center', animationDelay: '0.25s' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}><Sunrise size={14}/> SUNRISE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 500 }}>{weatherData.current.sunrise}</div>
                </div>
                <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}><Sunset size={14}/> SUNSET</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 500 }}>{weatherData.current.sunset}</div>
                </div>
                <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}><Wind size={14}/> WIND</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 500 }}>{weatherData.current.wind} <span style={{fontSize:'0.875rem', color:'var(--text-secondary)'}}>km/h</span></div>
                </div>
              </div>

              {/* City Image Gap Filler */}
              {cityImage && (
                <div className="glass-panel animate-fade-in" style={{ 
                  flex: 1, 
                  minHeight: '200px',
                  backgroundImage: `url(${cityImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '24px',
                  animationDelay: '0.3s',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }}></div>
                  <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)' }}>
                    {currentLocation?.name}
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Recommendations & Escapes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', animationDelay: '0.2s', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.02em', marginBottom: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowRight size={16} /> WHAT TO WEAR
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {recommendations.base.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>Base Layer</h4>
                        {renderClothingPills(recommendations.base)}
                      </div>
                    )}
                    {recommendations.bottoms.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>Bottoms</h4>
                        {renderClothingPills(recommendations.bottoms)}
                      </div>
                    )}
                    {(recommendations.outerwear.length > 0 || recommendations.footwear.length > 0) && (
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {recommendations.outerwear.length > 0 && (
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>Outerwear</h4>
                            {renderClothingPills(recommendations.outerwear)}
                          </div>
                        )}
                        {recommendations.footwear.length > 0 && (
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>Footwear</h4>
                            {renderClothingPills(recommendations.footwear)}
                          </div>
                        )}
                      </div>
                    )}
                    {recommendations.activities.length > 0 && (
                      <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500, display:'flex', alignItems:'center', gap:'0.4rem' }}><Activity size={14}/> Suggested Activities</h4>
                        {renderClothingPills(recommendations.activities)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Travel Escapes */}
              {escapes.length > 0 && (
                <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', animationDelay: '0.2s' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.02em', marginBottom: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plane size={16} /> NEED AN ESCAPE?
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
                    {escapes.map((escape, index) => (
                      <button
                        key={index}
                        onClick={() => fetchWeatherForLocation({ lat: escape.destination.lat, lon: escape.destination.lon, name: escape.destination.name, country: escape.destination.country })}
                        className="interactive"
                        style={{
                          flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                          padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer',
                          textAlign: 'left', color: 'inherit'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '1.5rem' }}>{escape.destination.emoji}</span>
                          <span style={{ fontWeight: 500, fontSize: '1.25rem' }}>{escape.temp}°</span>
                        </div>
                        <div>
                          <h4 style={{ fontWeight: 600, fontSize: '1rem' }}>{escape.destination.name}</h4>
                          <span className="text-secondary" style={{ fontSize: '0.75rem' }}>{escape.destination.country}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', animationDelay: '0.3s' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.02em', marginBottom: '1rem', color: 'var(--text-secondary)' }}>24-HOUR FORECAST</h3>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {weatherData.hourly?.map((hour, index) => (
                <div key={index} style={{ 
                  flex: '0 0 auto', 
                  minWidth: '60px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  padding: '0.5rem', 
                  color: index === 0 ? 'var(--text-primary)' : 'inherit',
                  position: 'relative'
                }}>
                  <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{index === 0 ? 'Now' : hour.time}</span>
                  <WeatherIcon condition={hour.condition} size={24} className={index === 0 ? '' : 'text-secondary'} />
                  <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>{hour.temp}°</span>
                  
                  {hour.precipProb > 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#0A84FF', fontWeight: 600, marginTop: '0.25rem' }}>
                      {hour.precipProb}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', animationDelay: '0.4s' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.02em', marginBottom: '1rem', color: 'var(--text-secondary)' }}>5-DAY FORECAST</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {weatherData.forecast.map((day, index) => (
                <div key={index} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '0.75rem 0', borderBottom: index < weatherData.forecast.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                }}>
                  <span style={{ fontWeight: 500, width: '60px', fontSize: '1.125rem' }}>{day.day}</span>
                  <WeatherIcon condition={day.condition} size={24} className="text-secondary" />
                  <div style={{ display: 'flex', gap: '1rem', width: '80px', justifyContent: 'flex-end', fontSize: '1.125rem' }}>
                    <span className="text-secondary" style={{ fontWeight: 500 }}>{day.tempMin}°</span>
                    <span style={{ fontWeight: 500 }}>{day.tempMax}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      ) : null}
      
      <style>
        {`
          @keyframes spin { 100% { transform: rotate(360deg); } }
          ::-webkit-scrollbar { height: 6px; width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
        `}
      </style>
    </div>
  )
}

export default App
