class Dial {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = Math.min(this.centerX, this.centerY) * 0.95;
    }

    draw(value, lowerSpec, upperSpec) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Rotate entire context 90 degrees counterclockwise
        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.translate(-this.centerX, -this.centerY);
        
        // Draw dial background
        this.drawDialBackground();
        
        // Calculate angles
        const range = upperSpec - lowerSpec;
        const startAngle = -Math.PI * 0.75;
        const endAngle = Math.PI * 0.75;
        const valueAngle = startAngle + (value - lowerSpec) / range * (endAngle - startAngle);
        
        // Draw specifications
        this.drawSpecifications(lowerSpec, upperSpec, startAngle, endAngle);
        
        // Draw needle
        this.drawNeedle(valueAngle, value);
        
        // Draw center hub
        this.drawCenterHub();
        
        // Restore context rotation
        this.ctx.restore();
        
        // Draw value text in the right space (no rotation needed)
        this.drawValueText(value);
    }

    drawValueText(value) {
        // Position the value at the bottom center
        this.ctx.font = 'bold 8px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#333';
        
        // Draw the value label and number at the bottom
        this.ctx.fillText('Current Value:', this.centerX, this.centerY + this.radius * 0.7);
        this.ctx.font = 'bold 8px Arial';
        this.ctx.fillText(value.toFixed(2), this.centerX, this.centerY + this.radius * 0.7 + 10);
    }

    drawDialBackground() {
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawSpecifications(lowerSpec, upperSpec, startAngle, endAngle) {
        this.ctx.font = '8px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#333';
        
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
            const angle = startAngle + (endAngle - startAngle) * (i / steps);
            const value = lowerSpec + (upperSpec - lowerSpec) * (i / steps);
            
            const x1 = this.centerX + Math.cos(angle) * this.radius;
            const y1 = this.centerY + Math.sin(angle) * this.radius;
            const x2 = this.centerX + Math.cos(angle) * (this.radius - 10);
            const y2 = this.centerY + Math.sin(angle) * (this.radius - 10);
            
            // Draw tick
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
            
            // Draw label with counter-rotation
            const labelX = this.centerX + Math.cos(angle) * (this.radius - 25);
            const labelY = this.centerY + Math.sin(angle) * (this.radius - 25);
            
            // Save current context state
            this.ctx.save();
            // Move to label position
            this.ctx.translate(labelX, labelY);
            // Counter-rotate the text (add PI/2 to compensate for the initial -PI/2 rotation)
            this.ctx.rotate(Math.PI/2);
            // Draw the text at origin (0,0) since we've translated to the label position
            this.ctx.fillText(value.toFixed(1), 0, 0);
            // Restore context state
            this.ctx.restore();
        }
    }

    drawNeedle(angle, value) {
        const needleLength = this.radius * 0.8;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.lineTo(
            this.centerX + Math.cos(angle) * needleLength,
            this.centerY + Math.sin(angle) * needleLength
        );
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    drawCenterHub() {
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 10, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#333';
        this.ctx.fill();
    }
} 