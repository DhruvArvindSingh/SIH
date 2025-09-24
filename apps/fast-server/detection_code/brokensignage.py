import cv2
import numpy as np
from .base_detector import BaseDetector

class BrokenSignageDetector(BaseDetector):
    def __init__(self, model_path='models/bad_sign_detector.onnx'):
        super().__init__(model_path)
        self.priority_color = (0, 165, 255)  # Orange for medium priority
        self.classes = {0: "broken_signage"}

    def predict_array(self, image_array, conf_threshold=0.25):
        """Predict on image array with medium priority logic"""
        annotated = image_array.copy()
        detections = []
        
        boxes, scores, classes = self.predict_onnx(image_array, conf_threshold)

        if len(boxes) > 0:
            for i, (box, score, cls_idx) in enumerate(zip(boxes, scores, classes)):
                x1, y1, x2, y2 = map(int, box)
                class_name = self.classes[cls_idx] if cls_idx < len(self.classes) else f"class_{cls_idx}"

                detections.append({
                    'id': i,
                    'class': class_name,
                    'bbox': [x1, y1, x2, y2],
                    'confidence': float(score),
                    'priority': 'medium',
                    'class_index': int(cls_idx)
                })

                cv2.rectangle(annotated, (x1, y1), (x2, y2), self.priority_color, 2)
                label = f"{class_name.title()} (MEDIUM) ({score:.2f})"
                label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
                cv2.rectangle(annotated, (x1, y1 - 25), (x1 + label_size[0], y1), self.priority_color, -1)
                cv2.putText(annotated, label, (x1, y1 - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        overall_priority = 'medium' if detections else 'low'

        return annotated, overall_priority, detections
