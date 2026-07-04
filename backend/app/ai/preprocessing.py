import cv2
import numpy as np

def noise_removal(img: np.ndarray) -> np.ndarray:
    """
    Remove noise from grayscale or RGB images.
    Grayscale images are enhanced using Fast Non-Local Means Denoising.
    """
    if len(img.shape) == 2:
        # Grayscale image
        denoised = cv2.fastNlMeansDenoising(img, None, h=10, templateWindowSize=7, searchWindowSize=21)
    else:
        # RGB image
        denoised = cv2.fastNlMeansDenoisingColored(img, None, h=10, hColor=10, templateWindowSize=7, searchWindowSize=21)
    return denoised

def contrast_enhancement(img: np.ndarray) -> np.ndarray:
    """
    Enhance contrast using CLAHE (Contrast Limited Adaptive Histogram Equalization).
    For grayscale, CLAHE is applied directly.
    For RGB, it converts to LAB, applies CLAHE on L channel, and converts back.
    """
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    
    if len(img.shape) == 2:
        return clahe.apply(img)
    else:
        # Convert to LAB space
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        # Apply CLAHE to L channel
        l_enhanced = clahe.apply(l)
        # Merge back and convert to BGR
        enhanced_lab = cv2.merge((l_enhanced, a, b))
        return cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
