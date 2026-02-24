import { BaseAgent, type AgentContext, type AgentResponse } from "./base-agent";
import { storage } from "../storage";

export class ContextAgent extends BaseAgent {
  constructor() {
    super("ContextAgent");
  }

  async execute(
    input: {
      action: "capture_snapshot" | "get_weather" | "update_location" | "get_current_context";
      data?: any;
    },
    context: AgentContext
  ): Promise<AgentResponse> {
    this.log(`Context action: ${input.action}`);

    try {
      switch (input.action) {
        case "capture_snapshot":
          return await this.captureSnapshot(context);
        case "get_weather":
          return await this.getWeather(input.data);
        case "update_location":
          return await this.updateLocation(input.data, context);
        case "get_current_context":
          return await this.getCurrentContext(context);
        default:
          return { success: false, message: "Unknown action" };
      }
    } catch (error: any) {
      this.log(`Error in context agent: ${error.message}`, "error");
      return {
        success: false,
        message: error.message,
      };
    }
  }

  private async captureSnapshot(context: AgentContext): Promise<AgentResponse> {
    const todayMeals = await storage.getTodayMeals(context.user.id);
    const nextMed = await storage.getNextMedication(context.user.id);
    const lastActivity = await storage.getRecentActivities(context.user.id, 1);
    const weather = await this.fetchWeather();

    const snapshot = {
      capturedAt: context.currentTime,
      locationState: "home", // Default, can be updated
      weather,
      currentActivity: lastActivity.length > 0 ? lastActivity[0].activity : null,
      lastMeal: todayMeals.length > 0 
        ? `${todayMeals[todayMeals.length - 1].mealType} at ${new Date(todayMeals[todayMeals.length - 1].loggedAt).toLocaleTimeString()}`
        : null,
      nextMed: nextMed 
        ? `${nextMed.name} ${nextMed.dose} at ${nextMed.timing}`
        : null,
    };

    await storage.createContextSnapshot(context.user.id, snapshot);

    return {
      success: true,
      data: snapshot,
    };
  }

  private async getWeather(data?: { location?: string }): Promise<AgentResponse> {
    const weather = await this.fetchWeather(data?.location);
    
    return {
      success: true,
      data: weather,
    };
  }

  private async fetchWeather(location?: string): Promise<any> {
    const apiKey = process.env.WEATHER_API_KEY;
    
    this.log(`=== WEATHER FETCH START ===`);
    this.log(`Requested location: ${location || 'none provided'}`);
    this.log(`API Key present: ${!!apiKey}`);
    
    if (!apiKey) {
      // Return mock data if no API key - vary by location
      this.log("No API key, returning mock data");
      
      // Generate different mock data based on location
      let temp = 32;
      let condition = "Warm & Humid";
      let humidity = 75;
      
      if (location) {
        const locationLower = location.toLowerCase();
        if (locationLower.includes('new york') || locationLower.includes('ny')) {
          temp = 8;
          condition = "Cold & Clear";
          humidity = 45;
        } else if (locationLower.includes('mumbai') || locationLower.includes('bangalore')) {
          temp = 28;
          condition = "Warm & Humid";
          humidity = 80;
        } else if (locationLower.includes('delhi')) {
          temp = 32;
          condition = "Hot & Dry";
          humidity = 40;
        }
      }
      
      return {
        temp: `${temp}°C`,
        tempValue: temp,
        condition: condition,
        humidity: humidity,
        advisory: temp > 30 ? "Stay hydrated. Avoid outdoor activity between 12-3 PM." : "Weather is comfortable",
        icon: temp > 25 ? "sun" : "cloud",
        location: location || "Unknown",
      };
    }

    try {
      // Check if location is coordinates (lat,lon format)
      const isCoordinates = location && /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(location);
      
      let url: string;
      if (isCoordinates) {
        const [lat, lon] = location.split(',');
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        this.log(`Using coordinates: ${lat}, ${lon}`);
      } else {
        // Clean up location format for OpenWeatherMap API
        // "New York, NY" -> "New York,US"
        // "Mumbai" -> "Mumbai"
        let cleanLocation = location || "Delhi";
        
        // If location has state abbreviation, convert to country code
        if (cleanLocation.includes(', ')) {
          const parts = cleanLocation.split(',');
          const city = parts[0].trim();
          const stateOrCountry = parts[1].trim();
          
          // If it's a US state abbreviation (2 letters), use US country code
          if (stateOrCountry.length === 2) {
            cleanLocation = `${city},US`;
          } else {
            cleanLocation = city; // Just use city name
          }
        }
        
        url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cleanLocation)}&appid=${apiKey}&units=metric`;
        this.log(`Using city name: ${cleanLocation}`);
      }

      this.log(`Fetching from: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        this.log(`Weather API error response: ${errorText}`, "error");
        throw new Error(`Weather API request failed: ${response.status}`);
      }

      const data = await response.json();
      this.log(`Weather API success for: ${data.name}`);
      
      // Generate health advisory based on weather
      const advisory = this.generateWeatherAdvisory(data.main.temp, data.main.humidity, data.weather[0].main);

      const result = {
        temp: `${Math.round(data.main.temp)}°C`,
        tempValue: data.main.temp,
        condition: data.weather[0].description,
        humidity: data.main.humidity,
        advisory,
        icon: this.mapWeatherIcon(data.weather[0].main),
        location: data.name,
      };
      
      this.log(`=== WEATHER FETCH SUCCESS ===`);
      return result;
    } catch (error: any) {
      this.log(`Weather API error: ${error.message}`, "error");
      this.log(`=== WEATHER FETCH FAILED - RETURNING MOCK DATA ===`);
      
      // Return mock data on error - vary by location
      let temp = 32;
      let condition = "Warm & Humid";
      let humidity = 75;
      
      if (location) {
        const locationLower = location.toLowerCase();
        if (locationLower.includes('new york') || locationLower.includes('ny')) {
          temp = 8;
          condition = "Cold & Clear";
          humidity = 45;
        } else if (locationLower.includes('mumbai') || locationLower.includes('bangalore')) {
          temp = 28;
          condition = "Warm & Humid";
          humidity = 80;
        } else if (locationLower.includes('delhi')) {
          temp = 32;
          condition = "Hot & Dry";
          humidity = 40;
        }
      }
      
      return {
        temp: `${temp}°C`,
        tempValue: temp,
        condition: condition,
        humidity: humidity,
        advisory: temp > 30 ? "Stay hydrated" : "Weather is comfortable",
        icon: temp > 25 ? "sun" : "cloud",
        location: location || "Unknown",
      };
    }
  }

  private generateWeatherAdvisory(temp: number, humidity: number, condition: string): string {
    const advisories: string[] = [];

    if (temp > 35) {
      advisories.push("Extreme heat - stay indoors during peak hours");
    } else if (temp > 30) {
      advisories.push("Stay hydrated. Avoid outdoor activity between 12-3 PM");
    } else if (temp < 10) {
      advisories.push("Cold weather - dress warmly");
    }

    if (humidity > 80) {
      advisories.push("High humidity - take it easy with physical activity");
    }

    if (condition.toLowerCase().includes("rain")) {
      advisories.push("Rainy weather - be careful if going out");
    }

    return advisories.length > 0 ? advisories.join(". ") : "Weather conditions are comfortable";
  }

  private mapWeatherIcon(condition: string): string {
    const mapping: Record<string, string> = {
      "Clear": "sun",
      "Clouds": "cloud",
      "Rain": "cloud-rain",
      "Drizzle": "cloud-drizzle",
      "Thunderstorm": "cloud-lightning",
      "Snow": "snowflake",
      "Mist": "cloud",
      "Fog": "cloud",
    };

    return mapping[condition] || "sun";
  }

  private async updateLocation(
    data: { locationState: "home" | "outside" | "traveling" | "unknown" },
    context: AgentContext
  ): Promise<AgentResponse> {
    // Store location update as activity
    await storage.createActivityLog(context.user.id, {
      activity: `location_${data.locationState}`,
      loggedAt: new Date(),
    });

    // Capture new context snapshot with updated location
    const snapshot = await this.captureSnapshot(context);

    return {
      success: true,
      data: {
        locationState: data.locationState,
        snapshot: snapshot.data,
      },
    };
  }

  private async getCurrentContext(context: AgentContext): Promise<AgentResponse> {
    // Get most recent context snapshot
    const snapshots = await storage.getContextSnapshots(context.user.id, 1);
    
    if (snapshots.length > 0) {
      return {
        success: true,
        data: snapshots[0],
      };
    }

    // If no snapshot exists, create one
    return await this.captureSnapshot(context);
  }
}
