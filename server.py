from flask import Flask, request, jsonify
from flask_cors import CORS
import replicate
import tempfile
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Set your Replicate API token here
os.environ["REPLICATE_API_TOKEN"] = "your_replicate_api_token_here"  # Replace this!

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "Server is running", "message": "Audio transcription service ready"})

@app.route("/transcribe", methods=["POST"])
def transcribe():
    try:
        logger.info("Received transcription request")
        
        # Check if file is present in request
        if 'file' not in request.files:
            logger.error("No file found in request")
            return jsonify({"error": "No audio file provided"}), 400
        
        audio_file = request.files['file']
        
        if audio_file.filename == '':
            logger.error("Empty filename")
            return jsonify({"error": "No file selected"}), 400
        
        logger.info(f"Processing audio file: {audio_file.filename}")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp:
            audio_file.save(temp.name)
            logger.info(f"Saved audio to temporary file: {temp.name}")
            
            try:
                # Run Replicate transcription
                logger.info("Starting Replicate API call...")
                output = replicate.run(
                    "openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2",
                    input={
                        "audio": open(temp.name, "rb"),
                        "model": "large-v3",
                        "language": "auto",
                        "translate": False,
                        "temperature": 0,
                        "suppress_tokens": "-1",
                        "logprob_threshold": -1.0,
                        "no_speech_threshold": 0.6,
                        "condition_on_previous_text": True
                    }
                )
                
                logger.info("Replicate API call successful")
                logger.info(f"Transcription result: {output}")
                
                # Clean up temporary file
                os.unlink(temp.name)
                
                # Extract transcription from output
                transcription = ""
                if isinstance(output, dict):
                    transcription = output.get("transcription", str(output))
                elif isinstance(output, str):
                    transcription = output
                else:
                    transcription = str(output)
                
                return jsonify({
                    "transcription": transcription,
                    "language": output.get("language") if isinstance(output, dict) else None
                })
                
            except Exception as replicate_error:
                logger.error(f"Replicate API error: {str(replicate_error)}")
                # Clean up temporary file
                if os.path.exists(temp.name):
                    os.unlink(temp.name)
                return jsonify({"error": f"Transcription failed: {str(replicate_error)}"}), 500
                
    except Exception as e:
        logger.error(f"Server error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == "__main__":
    logger.info("Starting Flask server...")
    app.run(debug=True, host="0.0.0.0", port=5100)