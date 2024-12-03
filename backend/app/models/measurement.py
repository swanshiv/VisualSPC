from app import db
from datetime import datetime

class Measurement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    process_name = db.Column(db.String(100), nullable=False)
    measurement_value = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    specification_lower = db.Column(db.Float)
    specification_upper = db.Column(db.Float)

    def to_dict(self):
        return {
            'id': self.id,
            'process_name': self.process_name,
            'measurement_value': self.measurement_value,
            'timestamp': self.timestamp.isoformat(),
            'specification_lower': self.specification_lower,
            'specification_upper': self.specification_upper
        } 