from datetime import datetime
import numpy as np
import random
from ..services.data_service import DataService

class GeneratorService:
    def __init__(self):
        self.processes = ["Process A", "Process B", "Process C"]
        self.process_specs = {
            "Process A": {"target": 100, "lower": 90, "upper": 110, "std": 2},
            "Process B": {"target": 50, "lower": 45, "upper": 55, "std": 1},
            "Process C": {"target": 75, "lower": 70, "upper": 80, "std": 1.5}
        }
        self.is_running = False

    def generate_measurement(self, process_name):
        specs = self.process_specs[process_name]
        value = np.random.normal(specs["target"], specs["std"])
        
        if random.random() < 0.05:
            value += random.choice([-1, 1]) * specs["std"] * 3

        return {
            "process_name": process_name,
            "value": round(value, 2),
            "lower_spec": specs["lower"],
            "upper_spec": specs["upper"],
            "timestamp": datetime.now().isoformat()
        }

    def generate_and_save(self):
        for process in self.processes:
            data = self.generate_measurement(process)
            DataService.save_measurements(data) 