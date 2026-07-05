import cv2
import numpy as np

class ImageEnhancer:
    def enhance(self, img: np.ndarray, scale: float = 1.5) -> np.ndarray:
        """
        High-performance OpenCV Super Resolution / Clarification model.
        Upscales the image using bicubic interpolation and applies
        an adaptive unsharp mask filter to enhance edge sharpness.
        """
        h, w = img.shape[:2]
        new_h, new_w = int(h * scale), int(w * scale)
        
        # 1. Bicubic upscale
        upscaled = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
        
        # 2. Unsharp Mask to sharpen edges
        blurred = cv2.GaussianBlur(upscaled, (0, 0), 3.0)
        sharpened = cv2.addWeighted(upscaled, 1.6, blurred, -0.6, 0)
        
        return sharpened

enhancer = ImageEnhancer()
