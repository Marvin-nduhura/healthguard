"""
HealthGuard PWA - Flask API Backend
Serves ML predictions, weather, COVID data, and mobility data
Developed by NDUHURA MARVIN for ANGEL TECHNOLOGIES LTD
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import pickle
import json
import numpy as np
from datetime import datetime
import sys, os

# ── Resolve paths relative to this file (works both locally and on Render) ──
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from covid_data_api import CovidDataAPI, get_healthcare_facilities
from weather_api import WeatherAPI
from mobility_api import MobilityAPI
from uganda_districts_complete import get_all_districts

app = Flask(__name__)

# ── CORS: allow Next.js on localhost AND any Render/Vercel domain ────────────
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "").split(",")
ALLOWED_ORIGINS = [o.strip() for o in ALLOWED_ORIGINS if o.strip()]
# Always add localhost for local dev
ALLOWED_ORIGINS += ["http://localhost:3000", "http://localhost:3001"]

CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True)

# ── Load ML models ──────────────────────────────────────────────────────────
def build_pytorch_model(input_size):
    try:
        import torch.nn as nn
        class CovidHotspotNN(nn.Module):
            def __init__(self, n_features):
                super().__init__()
                self.network = nn.Sequential(
                    nn.Linear(n_features, 256), nn.ReLU(), nn.BatchNorm1d(256), nn.Dropout(0.3),
                    nn.Linear(256, 128), nn.ReLU(), nn.BatchNorm1d(128), nn.Dropout(0.2),
                    nn.Linear(128, 64), nn.ReLU(), nn.Dropout(0.1),
                    nn.Linear(64, 1), nn.Sigmoid(),
                )
            def forward(self, x):
                return self.network(x)
        return CovidHotspotNN(input_size)
    except ImportError:
        return None

print("Loading ML models...")
rf_model = scaler = pytorch_model = pytorch_scaler = metadata = None
pytorch_available = False
pytorch_error = None

try:
    with open(os.path.join(BASE_DIR, 'covid_model.pkl'), 'rb') as f:
        rf_model = pickle.load(f)
    with open(os.path.join(BASE_DIR, 'covid_scaler.pkl'), 'rb') as f:
        scaler = pickle.load(f)
    with open(os.path.join(BASE_DIR, 'model_metadata.json'), 'r') as f:
        metadata = json.load(f)
    print(f"✅ Random Forest loaded ({metadata.get('accuracy', 0)*100:.1f}% accuracy)")

    try:
        import torch
        input_size = metadata.get('num_features', 24)
        pytorch_model = build_pytorch_model(input_size)
        pytorch_model.load_state_dict(
            torch.load(os.path.join(BASE_DIR, 'covid_pytorch_model.pth'),
                       map_location='cpu', weights_only=True)
        )
        pytorch_model.eval()
        with open(os.path.join(BASE_DIR, 'covid_pytorch_scaler.pkl'), 'rb') as f:
            pytorch_scaler = pickle.load(f)
        pytorch_available = True
        print("✅ PyTorch model loaded")
    except Exception as e:
        pytorch_error = str(e)
        print(f"⚠️  PyTorch unavailable: {e}")

except Exception as e:
    print(f"❌ Model loading failed: {e}")

# ── Initialize data APIs ─────────────────────────────────────────────────────
districts = get_all_districts()
weather_api = WeatherAPI()
mobility_api = MobilityAPI()
covid_api = CovidDataAPI()
print(f"✅ APIs initialized — {len(districts)} districts loaded")

# ── Enrich district info with urban level ────────────────────────────────────
def enrich_districts(d):
    from mobility_api import MobilityAPI as MA
    out = {}
    for name, info in d.items():
        e = dict(info)
        e['urban_level'] = MA._urban_level(name, e['pop'])
        out[name] = e
    return out

enriched = enrich_districts(districts)

# ── Feature builder ──────────────────────────────────────────────────────────
def build_feature_row(district, info, weather, mobility, covid):
    pop = info['pop']
    return {
        'latitude': info['lat'],
        'longitude': info['lon'],
        'population': pop,
        'population_density': pop / 100 + (abs(hash(district)) % 100 - 50),
        'border_proximity': 2 if district in ['Arua','Mbale','Kasese','Koboko','Tororo','Busia'] else 0,
        'international_airport': 1 if district in ['Kampala','Entebbe','Wakiso'] else 0,
        'urban_level': info.get('urban_level', 0),
        'healthcare_facilities_per_100k': get_healthcare_facilities(district),
        'temperature': weather.get('temperature', 24.0),
        'humidity': weather.get('humidity', 0.70),
        'rainfall': weather.get('rainfall', 0.0),
        'mobility_index': mobility.get('mobility_index', 60.0),
        'testing_rate': covid.get('testing_rate', 60.0),
        'new_cases_today': covid.get('new_cases_today', 0),
        'cumulative_cases': covid.get('cumulative_cases', 0),
        'active_cases': covid.get('active_cases', 0),
        'cumulative_deaths': covid.get('cumulative_deaths', 0),
        'new_deaths_today': covid.get('new_deaths_today', 0),
        'tests_conducted': covid.get('tests_conducted', 0),
        'cases_7day_avg': covid.get('cases_7day_avg', 0.0),
        'cases_14day_avg': covid.get('cases_14day_avg', 0.0),
        'growth_rate_pct': covid.get('growth_rate_pct', 0.0),
        'positivity_rate_pct': covid.get('positivity_rate_pct', 5.0),
        'cases_per_100k': covid.get('cases_per_100k', 100.0),
    }

# ── Routes ───────────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'app': 'HealthGuard PWA Flask API',
        'developer': 'NDUHURA MARVIN',
        'company': 'ANGEL TECHNOLOGIES LTD',
        'models': {
            'rf': rf_model is not None,
            'pytorch': pytorch_available,
            'pytorch_error': pytorch_error,
        },
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/predictions', methods=['GET'])
def get_predictions():
    model_choice = request.args.get('model', 'ensemble')
    if model_choice not in ('rf', 'pytorch', 'ensemble'):
        model_choice = 'ensemble'

    if rf_model is None:
        return jsonify({'error': 'Models not loaded. Run train_complete_models.py first.'}), 500

    try:
        weather_data  = weather_api.get_weather_for_districts(enriched)
        mobility_data = mobility_api.get_mobility_for_districts(enriched)
        covid_data    = covid_api.get_covid_data_for_districts(enriched)

        feature_cols = metadata.get('features', metadata.get('feature_columns', []))
        rows = []
        feature_matrix = []

        for district, info in enriched.items():
            weather  = weather_data.get(district,  {'temperature': 24.0, 'humidity': 0.7, 'rainfall': 0.0})
            mobility = mobility_data.get(district, {'mobility_index': 60.0})
            covid    = covid_data.get(district, {})
            row      = build_feature_row(district, info, weather, mobility, covid)
            rows.append({'district': district, 'info': info,
                         'weather': weather, 'mobility': mobility,
                         'covid': covid, 'row': row})
            feature_matrix.append([row[f] for f in feature_cols])

        X    = np.array(feature_matrix)
        X_rf = scaler.transform(X)
        rf_probs = rf_model.predict_proba(X_rf)[:, 1]

        pt_probs = None
        if pytorch_available and pytorch_model is not None:
            import torch
            X_pt = pytorch_scaler.transform(X)
            with torch.no_grad():
                pt_probs = pytorch_model(torch.FloatTensor(X_pt)).numpy().flatten()

        predictions = []
        for i, d in enumerate(rows):
            district = d['district']
            info     = d['info']
            weather  = d['weather']
            mobility = d['mobility']
            covid    = d['covid']

            rf_p = float(rf_probs[i])
            pt_p = float(pt_probs[i]) if pt_probs is not None else None

            if model_choice == 'ensemble' and pt_p is not None:
                prob        = (rf_p + pt_p) / 2
                model_label = 'Ensemble (RF + PyTorch)'
            elif model_choice == 'pytorch' and pt_p is not None:
                prob        = pt_p
                model_label = 'PyTorch Neural Network'
            else:
                prob        = rf_p
                model_label = 'Random Forest'

            risk_level = ('Most Likely' if prob > 0.7 else
                          'Likely'      if prob > 0.4 else
                          'Moderate'    if prob > 0.2 else
                          'Not Likely')

            predictions.append({
                'district': district,
                'latitude': info['lat'],
                'longitude': info['lon'],
                'population': info['pop'],
                'region': info['region'],
                'rfProbability': round(rf_p, 4),
                'pytorchProbability': round(pt_p, 4) if pt_p is not None else None,
                'probability': round(prob, 4),
                'prediction': 1 if prob > 0.5 else 0,
                'riskLevel': risk_level,
                'modelUsed': model_label,
                'temperature': round(weather.get('temperature', 24.0), 2),
                'humidity': round(weather.get('humidity', 0.7), 3),
                'rainfall': round(weather.get('rainfall', 0.0), 2),
                'mobilityIndex': round(mobility.get('mobility_index', 60.0), 2),
                'newCasesToday': int(covid.get('new_cases_today', 0)),
                'cumulativeCases': int(covid.get('cumulative_cases', 0)),
                'activeCases': int(covid.get('active_cases', 0)),
                'cumulativeDeaths': int(covid.get('cumulative_deaths', 0)),
                'newDeathsToday': int(covid.get('new_deaths_today', 0)),
                'testsConducted': int(covid.get('tests_conducted', 0)),
                'testingRate': round(covid.get('testing_rate', 60.0), 2),
                'positivityRatePct': round(covid.get('positivity_rate_pct', 5.0), 2),
                'casesPer100k': round(covid.get('cases_per_100k', 100.0), 2),
                'cases7dayAvg': round(covid.get('cases_7day_avg', 0.0), 2),
                'cases14dayAvg': round(covid.get('cases_14day_avg', 0.0), 2),
                'growthRatePct': round(covid.get('growth_rate_pct', 0.0), 2),
                'healthcareFacilitiesPer100k': round(get_healthcare_facilities(district), 2),
                'populationDensity': round(info['pop'] / 100 + (abs(hash(district)) % 100 - 50), 2),
                'borderProximity': 2 if district in ['Arua','Mbale','Kasese','Koboko','Tororo','Busia'] else 0,
                'internationalAirport': 1 if district in ['Kampala','Entebbe','Wakiso'] else 0,
                'urbanLevel': info.get('urban_level', 0),
            })

        high_risk   = [p for p in predictions if p['riskLevel'] == 'Most Likely']
        medium_risk = [p for p in predictions if p['riskLevel'] == 'Likely']
        low_risk    = [p for p in predictions if p['riskLevel'] in ('Moderate', 'Not Likely')]
        total_active = sum(p['activeCases'] for p in predictions)
        avg_prob     = sum(p['probability'] for p in predictions) / len(predictions) if predictions else 0

        w_covered = sum(1 for d in enriched if weather_data.get(d, {}).get('from_api'))
        m_covered = sum(1 for d in enriched if mobility_data.get(d, {}).get('from_api'))
        c_covered = sum(1 for d in enriched if covid_data.get(d, {}).get('from_api'))
        covid_info    = covid_api.get_data_source_info()
        mobility_info = mobility_api.get_data_source_info()

        return jsonify({
            'predictions': predictions,
            'stats': {
                'totalDistricts': len(predictions),
                'highRiskCount': len(high_risk),
                'mediumRiskCount': len(medium_risk),
                'lowRiskCount': len(low_risk),
                'avgProbability': round(avg_prob, 4),
                'totalActiveCases': total_active,
                'nationalActiveCases': getattr(covid_api, 'last_country_active', 0) or total_active,
                'lastUpdated': datetime.now().isoformat(),
            },
            'apiStatus': {
                'weather':  {'covered': w_covered, 'total': len(enriched), 'source': 'Open-Meteo'},
                'mobility': {'covered': m_covered, 'total': len(enriched),
                             'live': getattr(mobility_api, 'last_real_district_count', 0),
                             'source': mobility_info.get('source', 'Estimated')},
                'covid':    {'covered': c_covered, 'total': len(enriched),
                             'live': getattr(covid_api, 'using_live_api', False),
                             'source': covid_info.get('source', 'disease.sh'),
                             'apiDate': covid_info.get('api_updated')},
            },
            'modelInfo': {
                'accuracy': metadata.get('accuracy', 0),
                'rocAuc': metadata.get('roc_auc', 0),
                'numFeatures': metadata.get('num_features', 24),
                'totalDistricts': metadata.get('districts', 136),
                'trainingDate': metadata.get('training_date', ''),
                'features': metadata.get('features', []),
                'featureImportance': metadata.get('feature_importance', []),
                'pytorchAvailable': pytorch_available,
            },
            'modelChoice': model_choice,
            'timestamp': datetime.now().isoformat(),
        })

    except Exception as e:
        import traceback
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500


@app.route('/api/nutrition/screen', methods=['POST'])
def nutrition_screen():
    data       = request.get_json()
    muac       = data.get('muac')
    age        = data.get('age')
    result     = 'normal'
    confidence = 0.85
    recommendations = []

    if muac is not None:
        if muac < 115:
            result, confidence = 'severe', 0.92
            recommendations = [
                'Immediate therapeutic feeding required',
                'Refer to nearest Therapeutic Feeding Center (TFC)',
                'Medical evaluation for complications',
                'Family counseling on CMAM protocol',
            ]
        elif muac < 125:
            result, confidence = 'moderate', 0.88
            recommendations = [
                'Enroll in Supplementary Feeding Program (SFP)',
                'Provide Ready-to-Use Supplementary Food (RUSF)',
                'Weekly monitoring of MUAC',
                'Nutrition education for caregiver',
            ]
        elif muac < 135:
            result, confidence = 'mild', 0.80
            recommendations = [
                'Bi-weekly monitoring',
                'Dietary diversification counseling',
                'Vitamin A supplementation',
                'Deworming if indicated',
            ]
        else:
            result, confidence = 'normal', 0.90
            recommendations = [
                'Continue balanced diet',
                'Monthly growth monitoring',
                'Maintain vaccination schedule',
            ]

    return jsonify({
        'result': result,
        'confidence': confidence,
        'muac': muac,
        'age': age,
        'recommendations': recommendations,
        'timestamp': datetime.now().isoformat(),
        'screenedBy': 'HealthGuard AI Screening Tool',
    })


@app.route('/api/model-info', methods=['GET'])
def get_model_info():
    if metadata is None:
        return jsonify({'error': 'Model metadata not loaded'}), 500
    return jsonify({
        'metadata': metadata,
        'pytorchAvailable': pytorch_available,
        'pytorchError': pytorch_error,
    })


@app.route('/api/weather', methods=['GET'])
def get_weather():
    try:
        weather_data = weather_api.get_weather_for_districts(enriched)
        return jsonify({'weather': weather_data, 'timestamp': datetime.now().isoformat()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/covid', methods=['GET'])
def get_covid():
    try:
        covid_data = covid_api.get_covid_data_for_districts(enriched)
        return jsonify({
            'covid': covid_data,
            'source': covid_api.get_data_source_info(),
            'usingLiveApi': getattr(covid_api, 'using_live_api', False),
            'nationalActive': getattr(covid_api, 'last_country_active', 0),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── Entry point ──────────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=" * 60)
    print("HealthGuard PWA — Flask API Backend")
    print("Developed by NDUHURA MARVIN · ANGEL TECHNOLOGIES LTD")
    print(f"Listening on 0.0.0.0:{port}")
    print(f"RF={rf_model is not None}  PyTorch={pytorch_available}")
    print("=" * 60)
    app.run(host='0.0.0.0', port=port, debug=False)
