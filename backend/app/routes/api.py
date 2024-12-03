from flask import Blueprint, request, jsonify
from app.services.data_service import DataService
from app.services.chart_service import ChartService
from app.services.generator_service import GeneratorService
import io
import base64
import threading
import time
import logging

bp = Blueprint('api', __name__, url_prefix='/api')
generator = GeneratorService()
generator_thread = None

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def generate_loop():
    logger.debug("Starting generator loop")
    while generator.is_running:
        try:
            generator.generate_and_save()
            time.sleep(1)
        except Exception as e:
            logger.error(f"Error in generate loop: {str(e)}")
            generator.is_running = False

@bp.route('/generator/start', methods=['POST'])
def start_generator():
    global generator_thread
    try:
        if not generator.is_running:
            generator.is_running = True
            generator_thread = threading.Thread(target=generate_loop)
            generator_thread.start()
            logger.debug("Generator started successfully")
            return jsonify({'status': 'success', 'message': 'Generator started'})
        return jsonify({'status': 'success', 'message': 'Generator already running'})
    except Exception as e:
        logger.error(f"Error starting generator: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp.route('/generator/stop', methods=['POST'])
def stop_generator():
    try:
        generator.is_running = False
        logger.debug("Generator stopped successfully")
        return jsonify({'status': 'success', 'message': 'Generator stopped'})
    except Exception as e:
        logger.error(f"Error stopping generator: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp.route('/measurements/<process_name>', methods=['GET'])
def get_measurements(process_name):
    try:
        measurements = DataService.get_measurements(process_name)
        logger.debug(f"Retrieved {len(measurements)} measurements for {process_name}")
        return jsonify({
            'status': 'success',
            'data': measurements
        })
    except Exception as e:
        logger.error(f"Error getting measurements: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.route('/charts/control/<process_name>', methods=['GET'])
def get_control_chart(process_name):
    try:
        measurements = DataService.get_measurements(process_name)
        if not measurements:
            return jsonify({
                'status': 'success',
                'data': {'chart': None}
            })

        chart_bytes = ChartService.generate_control_chart(measurements)
        chart_base64 = base64.b64encode(chart_bytes.getvalue()).decode('utf-8')
        logger.debug(f"Generated chart for {process_name}")
        return jsonify({
            'status': 'success',
            'data': {'chart': chart_base64}
        })
    except Exception as e:
        logger.error(f"Error generating chart: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500 