import matplotlib
matplotlib.use('Agg')  # Set the backend before importing pyplot
import matplotlib.pyplot as plt
import io
from ..services.stats_service import StatsService

class ChartService:
    @staticmethod
    def generate_control_chart(measurements):
        # Extract just the measurement values
        values = [m['measurement_value'] for m in measurements]
        title = f"Control Chart for {measurements[0]['process_name']}"
        
        # Create the chart
        plt.figure(figsize=(12, 6))
        plt.plot(values, marker='o', linestyle='-', label='Measurements')
        
        # Calculate and plot control limits
        mean = sum(values) / len(values)
        std_dev = (sum((x - mean) ** 2 for x in values) / len(values)) ** 0.5
        
        ucl = mean + 3 * std_dev
        lcl = mean - 3 * std_dev
        
        plt.axhline(y=mean, color='g', linestyle='-', label='Mean')
        plt.axhline(y=ucl, color='r', linestyle='--', label='UCL')
        plt.axhline(y=lcl, color='r', linestyle='--', label='LCL')
        
        plt.title(title)
        plt.xlabel('Sample Number')
        plt.ylabel('Measurement Value')
        plt.legend()
        plt.grid(True)
        
        # Save to bytes buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        plt.close()
        
        return buf