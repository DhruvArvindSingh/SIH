import cv2
import numpy as np
import logging
from .base_detector import BaseDetector

logger = logging.getLogger(__name__)

class StreetlightDetector(BaseDetector):
    def __init__(self, model_path='models/streetlight.pt'):
        super().__init__(model_path)
        self.classes = {0: "broken_streetlight"}

        # Priority system for streetlight maintenance
        self.priority_colors = {
            'high': (255, 0, 0),      # Red - Critical maintenance
            'medium': (255, 255, 0),  # Yellow - Scheduled maintenance
            'low': (0, 255, 0),       # Green - Routine inspection
        }

        # Area thresholds for priority calculation
        self.area_thresholds = {
            'high_item': 0.20,   # 20% of image area = high priority
            'medium_item': 0.08, # 8% of image area = medium priority
        }

    def get_simple_priority(self, detection_details, img_area):
        """
        Calculate maintenance priority based on detection size and count

        Args:
            detection_details (list): List of detection dictionaries
            img_area (float): Image area in pixels

        Returns:
            str: Priority level ('high', 'medium', 'low')
        """
        if not detection_details:
            return 'low'

        high_count = sum(1 for d in detection_details if d['size_category'] == 'high')
        medium_count = sum(1 for d in detection_details if d['size_category'] == 'medium')
        low_count = sum(1 for d in detection_details if d['size_category'] == 'low')

        # Priority logic for streetlight infrastructure
        if high_count > 0:
            return 'high'  # Critical - immediate maintenance
        elif medium_count >= 2:
            return 'high'  # Multiple failures - urgent
        elif medium_count > 0 or low_count > 3:
            return 'medium'  # Significant issues - scheduled
        else:
            return 'low'  # Minor issues - routine

    def predict_array(self, image_array, conf_threshold=0.25):
        """Predict on image array with streetlight priority analysis"""
        h, w = image_array.shape[:2]
        img_area = h * w

        detection_details = []
        detections = []
        boxes, scores, classes = [], [], []

        if self.model_type == 'pytorch':
            results = self.model(image_array, conf=conf_threshold)
            if results[0].boxes is not None and len(results[0].boxes) > 0:
                boxes = results[0].boxes.xyxy.cpu().numpy()
                scores = results[0].boxes.conf.cpu().numpy()
                classes = results[0].boxes.cls.cpu().numpy()
        elif self.model_type == 'onnx':
            boxes, scores, classes = self.predict_onnx(image_array, conf_threshold)

        # Process detections
        for i, (box, score, cls) in enumerate(zip(boxes, scores, classes)):
            class_id = int(cls)
            class_name = self.classes.get(class_id, 'unknown')

            # Validate box coordinates
            x1, y1, x2, y2 = map(float, box)
            if x1 >= x2 or y1 >= y2:
                continue  # Invalid box

            # Calculate box area and area ratio
            box_width = x2 - x1
            box_height = y2 - y1
            box_area = box_width * box_height
            area_percentage = box_area / img_area

            # Determine size category
            if area_percentage > self.area_thresholds['high_item']:
                size_category = 'high'
            elif area_percentage > self.area_thresholds['medium_item']:
                size_category = 'medium'
            else:
                size_category = 'low'

            detection_details.append({
                'class_name': class_name,
                'confidence': score,
                'box': box,
                'class_id': class_id,
                'size_category': size_category,
                'area_percentage': area_percentage
            })

            detections.append({
                'id': i,
                'class': class_name,
                'bbox': box.tolist(),
                'confidence': float(score)
            })

        # Calculate overall priority
        overall_priority = self.get_simple_priority(detection_details, img_area)
        overall_color = self.priority_colors[overall_priority]

        # Create annotated image
        annotated_img = image_array.copy()

        for detail in detection_details:
            box = detail['box']
            class_name = detail['class_name']
            conf = detail['confidence']
            size_cat = detail['size_category']
            x1, y1, x2, y2 = map(int, box)

            # Draw bounding box
            cv2.rectangle(annotated_img, (x1, y1), (x2, y2), overall_color, 3)

            # Create label
            label = f"{class_name.replace('_', ' ').title()} ({size_cat.upper()}) {conf:.2f}"
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]

            # Draw label background
            cv2.rectangle(annotated_img, (x1, y1-30), (x1+label_size[0]+10, y1), overall_color, -1)
            cv2.putText(annotated_img, label, (x1+5, y1-8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        return annotated_img, overall_priority, detections
