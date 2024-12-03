from app import db
from app.models.measurement import Measurement
import pandas as pd
from typing import List, Dict

class DataService:
    # Initialize class variable to store measurements
    measurements = []
    
    @staticmethod
    def save_measurements(data):
        measurement = {
            "process_name": data["process_name"],
            "measurement_value": data["value"],
            "specification_lower": data["lower_spec"],
            "specification_upper": data["upper_spec"],
            "timestamp": data["timestamp"]
        }
        
        DataService.measurements.append(measurement)
        return measurement

    @staticmethod
    def get_measurements(process_name: str) -> List[Dict]:
        # Filter measurements by process name
        return [m for m in DataService.measurements if m["process_name"] == process_name]

    @staticmethod
    def import_csv(file_path: str, process_name: str):
        df = pd.read_csv(file_path)
        for _, row in df.iterrows():
            measurement = Measurement(
                process_name=process_name,
                measurement_value=row['value']
            )
            db.session.add(measurement)
        db.session.commit() 