import numpy as np
from typing import List, Tuple

class StatsService:
    @staticmethod
    def calculate_control_limits(data: List[float], 
                               sigma_level: int = 3) -> Tuple[float, float, float]:
        """Calculate control limits for a given dataset"""
        mean = np.mean(data)
        std = np.std(data, ddof=1)
        
        ucl = mean + (sigma_level * std)
        lcl = mean - (sigma_level * std)
        
        return lcl, mean, ucl

    @staticmethod
    def calculate_capability_indices(data: List[float], 
                                   usl: float, 
                                   lsl: float) -> Tuple[float, float, float]:
        """Calculate process capability indices (Cp, Cpu, Cpl)"""
        std = np.std(data, ddof=1)
        mean = np.mean(data)
        
        cp = (usl - lsl) / (6 * std)
        cpu = (usl - mean) / (3 * std)
        cpl = (mean - lsl) / (3 * std)
        
        return cp, cpu, cpl

    @staticmethod
    def check_normality(data: List[float]) -> bool:
        """Check if data follows normal distribution"""
        from scipy import stats
        _, p_value = stats.normaltest(data)
        return p_value > 0.05 