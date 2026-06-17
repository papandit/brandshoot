from flask import Flask, send_from_directory, make_response
from flask_cors import CORS
from flask_compress import Compress
from routes.generate import generate_bp
from routes.auth import auth_bp
from routes.video import video_bp
from routes.admin import admin_bp
from routes.admin_content import admin_content_bp
from routes.user import user_bp
from routes.content import content_bp
from routes.purchase import purchase_bp
import os

app = Flask(__name__)

# Enable gzip compression for all responses
Compress(app)

CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    supports_credentials=True
)

app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024
app.config["COMPRESS_MIMETYPES"] = [
    'text/html', 'text/css', 'text/xml', 'application/json',
    'application/javascript', 'image/jpeg', 'image/png', 'image/jpg'
]
app.config["COMPRESS_LEVEL"] = 6  # Compression level 1-9
app.config["COMPRESS_MIN_SIZE"] = 500  # Only compress files > 500 bytes  


app.register_blueprint(generate_bp, url_prefix="/generate")
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(video_bp, url_prefix="/video")
app.register_blueprint(admin_bp, url_prefix="/admin")
app.register_blueprint(user_bp, url_prefix="/user")
app.register_blueprint(content_bp, url_prefix="/content")
app.register_blueprint(admin_content_bp, url_prefix="/admin/content")
app.register_blueprint(purchase_bp, url_prefix="/purchase")

@app.route("/uploads/<path:filename>")
def serve_image(filename):
    """Serve images with aggressive caching headers for performance"""
    response = make_response(send_from_directory("uploads", filename))
    
    # Aggressive caching - 1 year for immutable images
    response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    response.headers['Expires'] = '31536000'
    
    # Vary on Origin so browsers don't reuse a cached response without CORS
    # headers for a CORS fetch() (causes net::ERR_FAILED)
    response.headers['Vary'] = 'Accept-Encoding, Origin'
    
    return response

@app.route("/")
def health():
    return {"status": "Gemini image backend running"}

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
