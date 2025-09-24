from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import base64
import io
import logging
from detection_code.garbage_detection import GarbageDetector
from detection_code.fallentree import FallenTreeDetector
from detection_code.brokensignage import BrokenSignageDetector
from detection_code.pothole_detector import PotholeDetector
from detection_code.streetlight_detector import StreetlightDetector
import torch # Ensure torch is imported for device checks
from datetime import datetime

app = FastAPI()

# Add CORS middleware to allow requests from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model paths
POTHOLE_MODEL_PATH = "models/Pothole-Detector.pt"
FALLEN_TREE_MODEL_PATH = "models/fallenTree.onnx"
BROKEN_SIGNAGE_MODEL_PATH = "models/bad_sign_detector.onnx"
GARBAGE_MODEL_PATH = "models/garbage_detection.pt"
STREETLIGHT_MODEL_PATH = "models/streetlight.pt"

# Load models
pothole_model = None
fallen_tree_model = None
broken_signage_model = None
garbage_detector = None
fallen_tree_detector = None
broken_signage_detector = None
streetlight_detector = None

def load_models():
    global pothole_model, fallen_tree_detector, broken_signage_detector, garbage_detector, streetlight_detector
    try:
        # Try to load pothole detector
        try:
            logger.info("Loading pothole detector...")
            pothole_model = PotholeDetector(POTHOLE_MODEL_PATH)
            logger.info("Pothole detector loaded.")
        except Exception as e:
            logger.warning(f"Pothole model failed to load: {str(e)[:100]}... POTHOLE DETECTION WILL BE DISABLED")
            logger.warning("Ensure the model file exists and try upgrading ultralytics if using .pt format: pip install ultralytics --upgrade")
            pothole_model = None

        try:
            logger.info("Loading fallen tree detector...")
            fallen_tree_detector = FallenTreeDetector(FALLEN_TREE_MODEL_PATH)
            logger.info("Fallen tree detector loaded.")
        except Exception as e:
            logger.warning(f"Fallen tree model failed to load: {str(e)[:100]}... FALLEN TREE DETECTION WILL BE DISABLED")
            fallen_tree_detector = None

        try:
            logger.info("Loading broken signage detector...")
            broken_signage_detector = BrokenSignageDetector(BROKEN_SIGNAGE_MODEL_PATH)
            logger.info("Broken signage detector loaded.")
        except Exception as e:
            logger.warning(f"Broken signage model failed to load: {str(e)[:100]}... BROKEN SIGNAGE DETECTION WILL BE DISABLED")
            broken_signage_detector = None

        logger.info("Loading garbage detection model...")
        try:
            garbage_detector = GarbageDetector(GARBAGE_MODEL_PATH)
            logger.info("Garbage model loaded.")
        except Exception as e:
            logger.warning(f"Garbage model failed to load: {str(e)[:100]}... GARBAGE DETECTION WILL BE DISABLED")
            logger.warning("Consider upgrading ultralytics: pip install ultralytics --upgrade")
            garbage_detector = None

        try:
            logger.info("Loading streetlight detector...")
            streetlight_detector = StreetlightDetector(STREETLIGHT_MODEL_PATH)
            logger.info("Streetlight detector loaded.")
        except Exception as e:
            logger.warning(f"Streetlight model failed to load: {str(e)[:100]}... STREETLIGHT DETECTION WILL BE DISABLED")
            streetlight_detector = None

        logger.info("🎯 Model loading completed! Available detections:")
        if pothole_model: logger.info("   ✅ Pothole Detection")
        else: logger.info("   🚫 Pothole Detection (disabled)")
        if fallen_tree_detector: logger.info("   ✅ Fallen Tree Detection")
        else: logger.info("   🚫 Fallen Tree Detection (disabled)")
        if broken_signage_detector: logger.info("   ✅ Broken Signage Detection")
        else: logger.info("   🚫 Broken Signage Detection (disabled)")
        if garbage_detector: logger.info("   ✅ Garbage Detection")
        else: logger.info("   🚫 Garbage Detection (disabled)")
        if streetlight_detector: logger.info("   ✅ Streetlight Detection")
        else: logger.info("   🚫 Streetlight Detection (disabled)")

    except Exception as e:
        logger.error(f"Error loading models: {e}")
        # In a production environment, you might want to handle this more gracefully
        # For now, we raise to ensure it's clear that model loading failed
        raise

load_models()

async def process_request(file: UploadFile, detector, model_name: str, priority_key: str):
    """Generic function to process an image upload and run detection."""
    # Log request details
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open("model_outputs.txt", "a", encoding="utf-8") as f:
        f.write(f"\n[{timestamp}] {model_name} - File: {file.filename}\n")

    try:
        if detector is None:
            error_msg = f"{model_name} model not loaded"
            with open("model_outputs.txt", "a", encoding="utf-8") as f:
                f.write(f"ERROR: {error_msg}\n")
            return JSONResponse(content={"error": error_msg}, status_code=500)

        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            error_msg = "Invalid image file"
            with open("model_outputs.txt", "a", encoding="utf-8") as f:
                f.write(f"ERROR: {error_msg}\n")
            return JSONResponse(content={"error": error_msg}, status_code=400)

        with open("model_outputs.txt", "a", encoding="utf-8") as f:
            f.write(f"Input image size: {image.shape}\n")

        annotated_image, overall_priority, detections = detector.predict_array(image)

        # Log results
        with open("model_outputs.txt", "a", encoding="utf-8") as f:
            f.write(f"Overall priority: {overall_priority}\n")
            f.write(f"Total detections: {len(detections)}\n")
            for det in detections:
                f.write(f"  - {det['class']} (conf: {det.get('confidence', 'N/A'):.3f}) - bbox: {det['bbox']}\n")
            f.write("=" * 50 + "\n")

        # Encode image to base64
        success, buffer = cv2.imencode('.jpg', annotated_image)
        if not success:
            with open("model_outputs.txt", "a", encoding="utf-8") as f:
                f.write("ERROR: Failed to encode annotated image\n")
            img_base64 = None
        else:
            img_base64 = base64.b64encode(buffer.tobytes()).decode('utf-8')

        result = {
            "detections": detections,
            priority_key: overall_priority,
            "total_detections": len(detections),
            "annotated_image": img_base64
        }
        return JSONResponse(content=result)

    except Exception as e:
        logger.error(f"{model_name} error: {e}")
        with open("model_outputs.txt", "a", encoding="utf-8") as f:
            f.write(f"EXCEPTION: {str(e)}\n")
            f.write("=" * 50 + "\n")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/pothole")
async def pothole_detection(file: UploadFile = File(...)):
    return await process_request(file, pothole_model, "Pothole detection", "road_priority")

@app.post("/fallentree")
async def fallen_tree_detection(file: UploadFile = File(...)):
    return await process_request(file, fallen_tree_detector, "Fallen tree detection", "fallentree_priority")

@app.post("/brokensignage")
async def broken_signage_detection(file: UploadFile = File(...)):
    return await process_request(file, broken_signage_detector, "Broken signage detection", "brokensignage_priority")

@app.post("/garbage")
async def garbage_detection(file: UploadFile = File(...)):
    return await process_request(file, garbage_detector, "Garbage detection", "garbage_priority")

@app.post("/streetlight")
async def streetlight_detection(file: UploadFile = File(...)):
    return await process_request(file, streetlight_detector, "Streetlight detection", "streetlight_priority")

@app.get("/")
async def root():
    return {"message": "ML Detection API", "endpoints": ["/pothole", "/fallentree", "/brokensignage", "/garbage", "/streetlight"]}
