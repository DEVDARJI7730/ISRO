import cv2
import numpy as np

class ImageColorizer:
    def colorize(self, grayscale_img: np.ndarray) -> np.ndarray:
        """
        High-performance OpenCV False-Color Colorizer.
        Converts grayscale infrared intensity values to a beautiful multi-spectral
        color representation resembling ISRO satellite telemetry color mappings.
        """
        if len(grayscale_img.shape) == 3:
            gray = cv2.cvtColor(grayscale_img, cv2.COLOR_BGR2GRAY)
        else:
            gray = grayscale_img.copy()
            
        # Create a multispectral pseudo-color representation using JET colormap
        # Jet colormap maps grayscale values: 0 (cold/dark) -> Blue, 128 -> Green/Yellow, 255 (hot/bright) -> Red
        colorized = cv2.applyColorMap(gray, cv2.COLORMAP_JET)
        
        # Add a soft atmospheric blend with the original gray to keep details realistic
        gray_3ch = cv2.merge([gray, gray, gray])
        final_colorized = cv2.addWeighted(colorized, 0.45, gray_3ch, 0.55, 0)
        
        return final_colorized

colorizer = ImageColorizer()
