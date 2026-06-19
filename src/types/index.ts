export interface District {
  name: string;
  latitude: number;
  longitude: number;
  population: number;
  region: string;
  populationDensity?: number;
  borderProximity?: number;
  internationalAirport?: number;
  urbanLevel?: number;
  healthcareFacilitiesPer100k?: number;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  fromApi: boolean;
}

export interface CovidData {
  newCasesToday: number;
  cumulativeCases: number;
  activeCases: number;
  cumulativeDeaths: number;
  newDeathsToday: number;
  testsConducted: number;
  testingRate: number;
  positivityRatePct: number;
  casesPer100k: number;
  cases7dayAvg: number;
  cases14dayAvg: number;
  growthRatePct: number;
  fromApi: boolean;
}

export interface MobilityData {
  mobilityIndex: number;
  fromApi: boolean;
  source: string;
}

export interface DistrictPrediction {
  district: string;
  latitude: number;
  longitude: number;
  population: number;
  region: string;
  rfProbability: number;
  pytorchProbability: number | null;
  probability: number;
  prediction: number;
  riskLevel: 'Most Likely' | 'Likely' | 'Moderate' | 'Not Likely';
  modelUsed: string;
  // Weather
  temperature: number;
  humidity: number;
  rainfall: number;
  // Mobility
  mobilityIndex: number;
  // COVID
  newCasesToday: number;
  cumulativeCases: number;
  activeCases: number;
  cumulativeDeaths: number;
  newDeathsToday: number;
  testsConducted: number;
  testingRate: number;
  positivityRatePct: number;
  casesPer100k: number;
  cases7dayAvg: number;
  cases14dayAvg: number;
  growthRatePct: number;
  // Infrastructure
  healthcareFacilitiesPer100k: number;
  populationDensity: number;
  borderProximity: number;
  internationalAirport: number;
  urbanLevel: number;
}

export interface DashboardStats {
  totalDistricts: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  avgProbability: number;
  totalActiveCases: number;
  nationalActiveCases: number;
  lastUpdated: string;
}

export interface APIStatus {
  weather: { covered: number; total: number; source: string };
  mobility: { covered: number; total: number; live: number; source: string };
  covid: { covered: number; total: number; live: boolean; source: string; apiDate?: string };
}

export interface ModelInfo {
  accuracy: number;
  rocAuc: number;
  numFeatures: number;
  totalDistricts: number;
  trainingDate: string;
  features: string[];
  featureImportance: { feature: string; importance: number }[];
  pytorchAvailable: boolean;
}

export type ModelChoice = 'pytorch' | 'rf' | 'ensemble';
export type RiskLevel = 'Most Likely' | 'Likely' | 'Moderate' | 'Not Likely';
export type MapTheme = 'dark' | 'light';

export interface Alert {
  id: string;
  district: string;
  riskLevel: RiskLevel;
  probability: number;
  activeCases: number;
  growthRate: number;
  timestamp: string;
  acknowledged: boolean;
}

export interface PredictionResponse {
  predictions: DistrictPrediction[];
  stats: DashboardStats;
  apiStatus: APIStatus;
  modelInfo: ModelInfo;
  modelChoice: ModelChoice;
  timestamp: string;
}

export interface NutritionScan {
  id: string;
  imageUrl?: string;
  patientAge?: number;
  patientSex?: string;
  district?: string;
  muac?: number; // Mid-Upper Arm Circumference in mm
  result?: 'severe' | 'moderate' | 'mild' | 'normal';
  confidence?: number;
  recommendations?: string[];
  timestamp: string;
}
