"""
Weather API Integration using Open-Meteo
Free, no API key required, unlimited requests
"""

import requests
from typing import Dict, Tuple

class WeatherAPI:
    """Fetch real-time weather data from Open-Meteo API"""
    
    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'COVID-Dashboard/1.0'
        })
    
    def get_weather_for_location(self, latitude: float, longitude: float) -> Dict[str, float]:
        """
        Get current weather for a specific location
        
        Args:
            latitude: Location latitude
            longitude: Location longitude
        
        Returns:
            dict: Weather data (temperature, humidity, rainfall)
        """
        try:
            params = {
                'latitude': latitude,
                'longitude': longitude,
                'current': 'temperature_2m,relative_humidity_2m,precipitation',
                'timezone': 'Africa/Kampala'
            }
            
            response = self.session.get(self.BASE_URL, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            current = data.get('current', {})
            
            return {
                'temperature': current.get('temperature_2m', 24.0),  # °C
                'humidity': current.get('relative_humidity_2m', 70.0) / 100,  # Convert to 0-1
                'rainfall': current.get('precipitation', 0.0),  # mm
                'from_api': True,
            }
        
        except requests.exceptions.Timeout:
            print(f"⚠️ Weather API timeout for ({latitude:.4f}, {longitude:.4f})")
            return self._get_default_weather()
        
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Weather API error for ({latitude:.4f}, {longitude:.4f}): {e}")
            return self._get_default_weather()
        
        except Exception as e:
            print(f"⚠️ Unexpected error fetching weather: {e}")
            return self._get_default_weather()
    
    def get_weather_for_districts(self, districts_dict: Dict, batch_size: int = 50) -> Dict[str, Dict[str, float]]:
        """
        Get weather for all districts using batched Open-Meteo requests.
        """
        weather_data = {}
        district_names = list(districts_dict.keys())
        success_count = 0

        for start in range(0, len(district_names), batch_size):
            chunk_names = district_names[start:start + batch_size]
            latitudes = [districts_dict[name]['lat'] for name in chunk_names]
            longitudes = [districts_dict[name]['lon'] for name in chunk_names]

            try:
                params = {
                    'latitude': ','.join(str(lat) for lat in latitudes),
                    'longitude': ','.join(str(lon) for lon in longitudes),
                    'current': 'temperature_2m,relative_humidity_2m,precipitation',
                    'timezone': 'Africa/Kampala',
                }
                response = self.session.get(self.BASE_URL, params=params, timeout=30)
                response.raise_for_status()
                results = response.json()

                if not isinstance(results, list):
                    results = [results]

                for name, result in zip(chunk_names, results):
                    current = result.get('current', {})
                    weather_data[name] = {
                        'temperature': current.get('temperature_2m', 24.0),
                        'humidity': current.get('relative_humidity_2m', 70.0) / 100,
                        'rainfall': current.get('precipitation', 0.0),
                        'from_api': True,
                    }
                    success_count += 1
            except Exception as e:
                print(f"⚠️ Weather batch failed ({start}-{start + len(chunk_names)}): {e}")
                for name in chunk_names:
                    info = districts_dict[name]
                    weather_data[name] = self.get_weather_for_location(info['lat'], info['lon'])

        for name in district_names:
            if name not in weather_data:
                info = districts_dict[name]
                weather_data[name] = self.get_weather_for_location(info['lat'], info['lon'])

        success_count = sum(1 for w in weather_data.values() if w.get('from_api'))
        print(f"✅ Fetched real weather for {success_count}/{len(districts_dict)} districts")
        return weather_data
    
    def _get_default_weather(self) -> Dict[str, float]:
        """Return default weather values when API fails"""
        return {
            'temperature': 24.0,  # Average Uganda temperature
            'humidity': 0.70,     # Average Uganda humidity
            'rainfall': 0.0,      # No rain (conservative)
            'from_api': False,
        }
    
    def test_connection(self) -> Tuple[bool, str]:
        """
        Test if API is accessible
        
        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            # Test with Kampala coordinates
            weather = self.get_weather_for_location(0.3476, 32.5825)
            
            if weather['temperature'] != 24.0 or weather['humidity'] != 0.70:
                return True, f"✅ API working! Kampala: {weather['temperature']:.1f}°C, {weather['humidity']*100:.0f}% humidity"
            else:
                return False, "⚠️ API returned default values"
        
        except Exception as e:
            return False, f"❌ API test failed: {e}"


# Test the API when run directly
if __name__ == "__main__":
    print("Testing Open-Meteo Weather API...")
    print("=" * 50)
    
    api = WeatherAPI()
    
    # Test connection
    success, message = api.test_connection()
    print(message)
    
    if success:
        print("\nTesting multiple locations:")
        print("-" * 50)
        
        # Test a few Uganda cities
        test_locations = {
            'Kampala': (0.3476, 32.5825),
            'Gulu': (2.7724, 32.2881),
            'Mbarara': (-0.6072, 30.6545),
            'Jinja': (0.4394, 33.2040)
        }
        
        for city, (lat, lon) in test_locations.items():
            weather = api.get_weather_for_location(lat, lon)
            print(f"{city:12s}: {weather['temperature']:5.1f}°C | "
                  f"{weather['humidity']*100:5.1f}% | "
                  f"{weather['rainfall']:5.1f}mm")
        
        print("\n✅ Weather API is working perfectly!")
    else:
        print("\n⚠️ Weather API test failed. Will use default values.")
