"""
Mobility Data API Integration

Data sources (priority):
1. Meta Movement Range Maps (HDX) — Uganda admin regions, cached locally after one-time download
2. Population / urban-level estimates (fallback)

Note: There is no free live REST API for per-district Uganda mobility. Meta data on HDX
is the best open option but ships as a ~70MB zip (last updated May 2022).
"""

import io
import json
import re
import zipfile
from pathlib import Path
from typing import Dict, Optional, Tuple

import numpy as np
import pandas as pd
import requests
from datetime import datetime, timedelta

CACHE_DIR = Path(__file__).parent / 'mobility_cache'
PARSED_CACHE_FILE = CACHE_DIR / 'uga_district_mobility.json'
ZIP_CACHE_FILE = CACHE_DIR / 'movement-range-data.zip'
HDX_ZIP_URL = (
    'https://data.humdata.org/dataset/c3429f0e-651b-4788-bb2f-4adbf222c90e/resource/'
    '55a51014-0d27-49ae-bf92-c82a570c2c6c/download/movement-range-data-2022-05-22.zip'
)


class MobilityAPI:
    """Fetch mobility data for Uganda districts."""

    HDX_BASE_URL = 'https://data.humdata.org/api/3/action'
    HDX_DATASET_ID = 'movement-range-maps'

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'COVID-Dashboard/1.0'})
        self.cache: Dict[str, float] = {}
        self.cache_timestamp: Optional[datetime] = None
        self.cache_duration = timedelta(hours=6)
        self.last_real_district_count = 0
        self.data_source_note = ''

    @staticmethod
    def _urban_level(district: str, population: int) -> int:
        if district == 'Kampala':
            return 3
        if district in ['Wakiso', 'Gulu', 'Mbarara', 'Jinja', 'Entebbe']:
            return 2
        if population > 300000:
            return 1
        return 0

    @staticmethod
    def _normalize_name(name: str) -> str:
        return re.sub(r'\s+', ' ', str(name).strip().lower().replace(' district', ''))

    def get_mobility_for_districts(self, districts_dict: Dict) -> Dict[str, Dict[str, float]]:
        hdx_data = self._fetch_hdx_mobility_data()
        mobility_data = {}
        real_count = 0

        for district, info in districts_dict.items():
            pop = info.get('pop', 100000)
            urban_level = info.get('urban_level', self._urban_level(district, pop))

            if hdx_data and district in hdx_data:
                mobility_data[district] = {
                    'mobility_index': hdx_data[district],
                    'from_api': True,
                    'source': 'Meta Movement Range (HDX)',
                }
                real_count += 1
            else:
                estimated = self._estimate_mobility(pop, urban_level, district)
                estimated['from_api'] = False
                estimated['source'] = 'Estimated (population / urban level)'
                mobility_data[district] = estimated

        self.last_real_district_count = real_count
        if real_count > 0:
            print(f"Meta mobility matched {real_count}/{len(districts_dict)} districts")
        else:
            print(f"Using estimated mobility for all {len(districts_dict)} districts")
        return mobility_data

    def _fetch_hdx_mobility_data(self) -> Optional[Dict[str, float]]:
        if self._is_cache_valid():
            return self.cache

        parsed = self._load_disk_cache()
        if parsed:
            self.cache = parsed
            self.cache_timestamp = datetime.now()
            self.data_source_note = 'Meta Movement Range Maps (HDX, cached)'
            return parsed

        self.data_source_note = (
            'No live Uganda mobility API. Use sidebar to download optional Meta cache (~70MB, 2022 data).'
        )
        return None

    def build_meta_mobility_cache(self) -> Tuple[bool, str]:
        """One-time download of Meta movement-range zip from HDX (optional, ~70MB)."""
        try:
            parsed = self._build_cache_from_hdx_zip()
            if not parsed:
                return False, 'Could not parse Uganda mobility from HDX zip.'
            self.cache = parsed
            self.cache_timestamp = datetime.now()
            self._save_disk_cache(parsed)
            self.data_source_note = 'Meta Movement Range Maps (HDX)'
            return True, f'Cached Meta mobility for {len(parsed)} districts.'
        except Exception as e:
            return False, str(e)

    def _load_disk_cache(self) -> Optional[Dict[str, float]]:
        if not PARSED_CACHE_FILE.exists():
            return None
        try:
            with open(PARSED_CACHE_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return {k: float(v) for k, v in data.get('districts', {}).items()}
        except Exception as e:
            print(f"Could not read mobility cache: {e}")
            return None

    def _save_disk_cache(self, mobility_dict: Dict[str, float]) -> None:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        payload = {
            'source': 'Meta Movement Range Maps (HDX)',
            'updated': datetime.now().isoformat(),
            'districts': mobility_dict,
        }
        with open(PARSED_CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(payload, f, indent=2)

    def _build_cache_from_hdx_zip(self) -> Optional[Dict[str, float]]:
        """Download Meta zip once, extract Uganda CSV, map admin names to districts."""
        try:
            if not ZIP_CACHE_FILE.exists():
                print('Downloading Meta mobility zip from HDX (~70MB, one-time)...')
                self._download_zip(HDX_ZIP_URL, ZIP_CACHE_FILE)

            uganda_df = self._read_uganda_csv_from_zip(ZIP_CACHE_FILE)
            if uganda_df is None or uganda_df.empty:
                return None

            mobility_dict = self._parse_hdx_data(uganda_df)
            if not mobility_dict:
                return None

            from uganda_districts_complete import get_all_districts
            return self._match_to_districts(mobility_dict, get_all_districts())
        except Exception as e:
            print(f"Meta mobility download/parse failed: {e}")
            return None

    def _download_zip(self, url: str, dest: Path) -> None:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        with self.session.get(url, stream=True, timeout=300) as response:
            response.raise_for_status()
            with open(dest, 'wb') as f:
                for chunk in response.iter_content(chunk_size=1024 * 256):
                    if chunk:
                        f.write(chunk)

    def _read_uganda_csv_from_zip(self, zip_path: Path) -> Optional[pd.DataFrame]:
        """HDX zip is usually one global TSV (movement-range-YYYY-MM-DD.txt), not per-country CSVs."""
        with zipfile.ZipFile(zip_path, 'r') as zf:
            candidates = [
                n for n in zf.namelist()
                if 'movement-range' in n.lower()
                and n.lower().endswith(('.txt', '.csv', '.tsv'))
                and 'readme' not in n.lower()
            ]
            if not candidates:
                candidates = [n for n in zf.namelist() if n.lower().endswith(('.csv', '.txt', '.tsv'))]

            if not candidates:
                print('No mobility data file found inside Meta zip')
                return None

            target = sorted(candidates, reverse=True)[0]
            print(f"Parsing mobility file: {target}")

            with zf.open(target) as f:
                df = pd.read_csv(f, sep='\t', low_memory=False)
                if df.shape[1] <= 1:
                    f.seek(0)
                    df = pd.read_csv(f, low_memory=False)

            country_col = None
            for col in ['country', 'country_code', 'country_region', 'iso3']:
                if col in df.columns:
                    country_col = col
                    break

            if country_col:
                mask = df[country_col].astype(str).str.upper().isin(['UGA', 'UG', 'UGANDA'])
                uganda_df = df.loc[mask].copy()
                if not uganda_df.empty:
                    print(f"Filtered {len(uganda_df):,} Uganda rows from Meta mobility file")
                    return uganda_df

            print('No Uganda rows in Meta mobility file')
            return None

    def _match_to_districts(self, admin_mobility: Dict[str, float], districts_dict: Dict) -> Dict[str, float]:
        """Map Meta admin polygon names to our 136 district names."""
        normalized_admin = {self._normalize_name(k): v for k, v in admin_mobility.items()}
        result = {}

        for district in districts_dict:
            key = self._normalize_name(district)
            if key in normalized_admin:
                result[district] = normalized_admin[key]
                continue
            # Try partial match (e.g. "Kampala" in "Kampala Capital City")
            for admin_name, value in normalized_admin.items():
                if key in admin_name or admin_name in key:
                    result[district] = value
                    break

        if not result and normalized_admin:
            # National fallback: use mean of all Uganda admin units
            national_avg = float(np.mean(list(normalized_admin.values())))
            for district in districts_dict:
                result[district] = national_avg

        return result

    def _parse_hdx_data(self, df: pd.DataFrame) -> Dict[str, float]:
        mobility_dict = {}
        district_col = None
        for col in ['polygon_name', 'admin_name', 'district', 'name', 'geo_name']:
            if col in df.columns:
                district_col = col
                break

        mobility_col = None
        for col in [
            'all_day_bing_tiles_visited_relative_change',
            'movement_change',
            'mobility_index',
            'change_in_movement',
        ]:
            if col in df.columns:
                mobility_col = col
                break

        if not district_col or not mobility_col:
            print(f"Mobility CSV columns not recognized: {list(df.columns)[:12]}")
            return {}

        if 'date' in df.columns:
            df = df.sort_values('date')
            df = df.groupby(district_col, as_index=False).last()

        for _, row in df.iterrows():
            name = row[district_col]
            value = row[mobility_col]
            if pd.notna(name) and pd.notna(value):
                mobility_index = 60 + (float(value) * 40)
                mobility_dict[str(name)] = float(np.clip(mobility_index, 0, 100))

        return mobility_dict

    def _is_cache_valid(self) -> bool:
        if not self.cache or not self.cache_timestamp:
            return False
        return datetime.now() - self.cache_timestamp < self.cache_duration

    def _estimate_mobility(self, population: int, urban_level: int, district: str = '') -> Dict[str, float]:
        base_mobility = {0: 40, 1: 55, 2: 70, 3: 85}
        base = base_mobility.get(urban_level, 60)
        pop_factor = min(population / 500000, 1.0) * 15
        seed = abs(hash(district or str(population))) % (2 ** 32)
        variation = np.random.RandomState(seed).uniform(-5, 5)
        mobility_index = float(np.clip(base + pop_factor + variation, 20, 95))
        return {'mobility_index': mobility_index}

    def test_connection(self) -> Tuple[bool, str]:
        try:
            url = f'{self.HDX_BASE_URL}/package_show'
            response = self.session.get(url, params={'id': self.HDX_DATASET_ID}, timeout=10)
            if response.status_code == 200 and response.json().get('success'):
                cached = PARSED_CACHE_FILE.exists()
                return True, (
                    'HDX Meta Movement Range Maps reachable. '
                    + ('Local Uganda cache loaded.' if cached else 'No local cache yet (~70MB zip on first fetch).')
                )
            return False, f'HDX returned status {response.status_code}'
        except Exception as e:
            return False, f'HDX test failed: {e}'

    def get_data_source_info(self) -> Dict[str, str]:
        if self.last_real_district_count > 0 or PARSED_CACHE_FILE.exists():
            return {
                'source': self.data_source_note or 'Meta Movement Range (HDX)',
                'status': 'Real Data (historical)',
                'last_updated': (
                    self.cache_timestamp.strftime('%Y-%m-%d %H:%M:%S')
                    if self.cache_timestamp else 'from disk cache'
                ),
                'districts_covered': self.last_real_district_count or len(self.cache),
                'update_frequency': 'Cached (Meta data ends ~2022)',
            }
        return {
            'source': 'Estimated (population / urban level)',
            'status': 'No Uganda live mobility API',
            'last_updated': 'N/A',
            'districts_covered': 0,
            'update_frequency': 'Per session',
        }


if __name__ == '__main__':
    print('Testing Mobility API...')
    api = MobilityAPI()
    ok, msg = api.test_connection()
    print(msg)
