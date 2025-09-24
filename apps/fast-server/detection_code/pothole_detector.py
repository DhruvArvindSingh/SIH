import cv2
import numpy as np
import logging
from collections import Counter
from .base_detector import BaseDetector

logger = logging.getLogger(__name__)

def estimate_pothole_depth(image, contour):
    """
    Estimates pothole depth score (0-1) based on shadow analysis using contour.
    """
    try:
        gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        mask = np.zeros_like(gray_image)
        cv2.drawContours(mask, [contour], 0, 255, -1)

        pixel_values = gray_image[mask == 255]
        if pixel_values.size == 0:
            return 0.0

        darkness_score = 1 - (np.mean(pixel_values) / 255.0)
        contrast_score = min(np.std(pixel_values) / 50.0, 1.0) if pixel_values.size > 1 else 0.0
        return max(0.0, min(1.0, (0.7 * darkness_score) + (0.3 * contrast_score)))

    except Exception as e:
        print(f"Could not estimate depth: {e}")
        return 0.0

def get_individual_pothole_priority(area_ratio, depth_score):
    """
    Determines an individual pothole's priority ('High', 'Medium', 'Low').
    """
    combined_score = (0.6 * area_ratio * 100) + (0.4 * depth_score)
    if combined_score > 0.6 or (area_ratio > 0.01 and depth_score > 0.6):
        return 'High', (0, 0, 255)  # Red
    elif combined_score > 0.3 or (area_ratio > 0.005 and depth_score > 0.4):
        return 'Medium', (0, 165, 255)  # Orange
    else:
        return 'Low', (0, 255, 0)  # Green

def determine_road_priority(potholes_list, proximity_threshold, image_shape):
    """
    Determines the overall road priority based on all detected potholes.
    """
    if not potholes_list:
        return 'Low', (0, 255, 0), []

    high_count = sum(1 for p in potholes_list if p['priority'] == 'High')
    medium_count = sum(1 for p in potholes_list if p['priority'] == 'Medium')

    clusters, processed = [], set()
    for i, p1 in enumerate(potholes_list):
        if i in processed: continue
        cluster, q = [i], [i]
        processed.add(i)
        while q:
            curr = q.pop(0)
            for j, p2 in enumerate(potholes_list):
                if j not in processed and np.linalg.norm(np.array(p1['bbox'][:2]) - np.array(p2['bbox'][:2])) < proximity_threshold:
                    processed.add(j)
                    cluster.append(j)
                    q.append(j)
        clusters.append(cluster)

    total_area_ratio = sum(p['area_ratio'] for p in potholes_list)

    if (high_count >= 2 or (high_count >= 1 and medium_count >= 2) or
        total_area_ratio > 0.05 or len([c for c in clusters if len(c) >= 3]) > 0):
        return 'High', (0, 0, 255), clusters
    elif (high_count >= 1 or medium_count >= 2 or total_area_ratio > 0.02 or
          len([c for c in clusters if len(c) >= 2]) > 0):
        return 'Medium', (0, 165, 255), clusters
    else:
        return 'Low', (0, 255, 0), clusters


class PotholeDetector(BaseDetector):
    def __init__(self, model_path='models/Pothole-Detector.pt'):
        super().__init__(model_path)

    def predict_array(self, image_array, conf_threshold=0.25):
        """Predict on image array with pothole priority analysis"""
        h, w = image_array.shape[:2]
        image_area = h * w
        detections = []
        annotated = image_array.copy()

        if self.model_type == 'pytorch':
            results = self.model(image_array, conf=conf_threshold)
            result = results[0]
            if result.boxes is not None and len(result.boxes) > 0:
                boxes = result.boxes.xyxy.cpu().numpy()
                scores = result.boxes.conf.cpu().numpy()

                # Check for instance segmentation masks
                if hasattr(result, 'masks') and result.masks is not None and len(result.masks.xy) > 0:
                    contours = [c.astype(np.int32) for c in result.masks.xy]
                else:
                    contours = None  # Will use box fallback
            else:
                boxes, scores, contours = [], [], None
        elif self.model_type == 'onnx':
            boxes, scores, _ = self.predict_onnx(image_array, conf_threshold)
            contours = None  # ONNX fallback to boxes

        if len(boxes) > 0 and len(scores) > 0:
            for i, (box, score) in enumerate(zip(boxes, scores)):
                x1b, y1b, x2b, y2b = map(int, box)

                # Calculate priority first to get color
                # Create contour for area calculation - use mask if available for better area
                if contours and i < len(contours):
                    contour = contours[i]
                    contour_area = cv2.contourArea(contour)
                else:
                    # Fallback to bounding box for area
                    contour = np.array([[x1b, y1b], [x2b, y1b], [x2b, y2b], [x1b, y2b]], dtype=np.int32)
                    contour_area = cv2.contourArea(contour)

                area_ratio = contour_area / image_area
                depth_score = estimate_pothole_depth(image_array, contour)
                priority, color = get_individual_pothole_priority(area_ratio, depth_score)

                # Now draw with correct color
                if contours and i < len(contours):
                    cv2.drawContours(annotated, [contour], -1, color, 2)  # Draw precise contour
                else:
                    cv2.rectangle(annotated, (x1b, y1b), (x2b, y2b), color, 2)  # Draw bounding box

                detections.append({
                    'id': i,
                    'class': 'pothole',
                    'bbox': [x1b, y1b, x2b, y2b],
                    'confidence': float(score),
                    'area_ratio': area_ratio,
                    'depth_score': depth_score,
                    'priority': priority
                })

                # Still draw priority label with confidence
                label = f"Pothole ({priority.upper()}) ({score:.2f})"
                label_y = min(y1b - 8, y2b - 10) if contour is None else y1b - 8
                if label_y < 20:
                    label_y = y2b + 20  # Below box if too high

                label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
                cv2.rectangle(annotated, (x1b, label_y - 20), (x1b + label_size[0], label_y), color, -1)
                cv2.putText(annotated, label, (x1b, label_y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        # Prioritize based on detections but don't draw text
        road_priority, _, _ = determine_road_priority(detections, 150, (h, w))

        return annotated, road_priority, detections
