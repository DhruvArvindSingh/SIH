import cv2
import numpy as np
import logging
from .base_detector import BaseDetector

logger = logging.getLogger(__name__)

class GarbageDetector(BaseDetector):
    def __init__(self, model_path='models/garbage_detection.pt'):
        super().__init__(model_path)
        self.classes = {0: "garbage"}

        self.priority_colors = {
            'high': (255, 0, 0),
            'medium': (255, 255, 0),
            'low': (0, 255, 0),
        }

        self.area_thresholds = {
            'high_item': 0.17,
            'medium_item': 0.07,
        }

    def get_simple_priority(self, detection_details):
        """
        Enhanced priority logic based on size and quantity.
        """
        if not detection_details:
            return 'low'

        low_count = sum(1 for d in detection_details if d['size_category'] == 'low')
        medium_count = sum(1 for d in detection_details if d['size_category'] == 'medium')
        high_count = sum(1 for d in detection_details if d['size_category'] == 'high')

        if high_count > 0:
            return 'high'
        if medium_count >= 2:
            return 'high'
        if low_count > 2:
            return 'medium'
        if medium_count > 0:
            return 'medium'
        return 'low'

    def predict_array(self, image_array, conf_threshold=0.25):
        """Predict on image array with priority logic"""
        annotated_img = image_array.copy()
        img_shape = image_array.shape
        img_area = img_shape[0] * img_shape[1]
        detections = []
        detection_details = []
        boxes, scores, classes = [], [], []

        if self.model_type == 'pytorch':
            results = self.model(image_array, conf=conf_threshold)
            if results[0].boxes is not None and len(results[0].boxes) > 0:
                boxes = results[0].boxes.xyxy.cpu().numpy()
                scores = results[0].boxes.conf.cpu().numpy()
                classes = results[0].boxes.cls.cpu().numpy()
        elif self.model_type == 'onnx':
            boxes, scores, classes = self.predict_onnx(image_array, conf_threshold)

        if len(boxes) > 0:
            for i, (box, score, cls) in enumerate(zip(boxes, scores, classes)):
                class_id = int(cls)
                class_name = self.classes.get(class_id, 'unknown')
                box_width = box[2] - box[0]
                box_height = box[3] - box[1]
                box_area = box_width * box_height
                area_percentage = box_area / img_area

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
                })
                detections.append({
                    'id': i,
                    'class': class_name,
                    'bbox': box.tolist(),
                    'confidence': float(score)
                })

        overall_priority = self.get_simple_priority(detection_details)
        overall_color = self.priority_colors[overall_priority]

        for detail in detection_details:
            box = detail['box']
            class_name = detail['class_name']
            conf = detail['confidence']
            size_cat = detail['size_category']
            x1, y1, x2, y2 = map(int, box)

            cv2.rectangle(annotated_img, (x1, y1), (x2, y2), overall_color, 3)
            label = f"{class_name.title()} ({size_cat.upper()}) {conf:.2f}"
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
            cv2.rectangle(annotated_img, (x1, y1 - 25), (x1 + label_size[0], y1), overall_color, -1)
            cv2.putText(annotated_img, label, (x1, y1 - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        return annotated_img, overall_priority, detections
