import cv2
import numpy as np

def edge_preserving_filter(img: np.ndarray) -> np.ndarray:
    """
    Applies bilateral filtering to smooth out textures and noise while
    keeping boundaries and sharp edges intact.
    """
    # d: Diameter of each pixel neighborhood (use 9 for offline filters, 5 for real-time)
    # sigmaColor: Filter sigma in the color space. A larger value means that farther colors within the pixel neighborhood will be mixed together.
    # sigmaSpace: Filter sigma in the coordinate space. A larger value means that farther pixels will influence each other.
    filtered = cv2.bilateralFilter(img, d=9, sigmaColor=75, sigmaSpace=75)
    return filtered
