import os
import cv2
import numpy as np
import time
import asyncio
from typing import Callable, Dict, Any, Tuple
from backend.app.ai.preprocessing import noise_removal, contrast_enhancement
from backend.app.ai.enhancer import enhancer
from backend.app.ai.colorizer import colorizer
from backend.app.ai.postprocessing import edge_preserving_filter

async def process_image_pipeline(
    input_path: str,
    output_dir: str,
    progress_callback: Callable[[int, str], None] = None
) -> Tuple[Dict[str, Any], float]:
    """
    Executes the full image processing pipeline step-by-step.
    
    Pipeline Steps:
    1. Load image & Resize / Format standard (15%)
    2. OpenCV Noise Removal (30%)
    3. OpenCV Contrast Enhancement via CLAHE (45%)
    4. PyTorch Super Resolution & Sharpness (65%)
    5. PyTorch Deep Grayscale to RGB Colorization (80%)
    6. Edge Preservation Bilateral filtering (95%)
    7. Saving results and calculating metadata (100%)
    
    Returns a dictionary of generated file paths (original, enhanced, colorized),
    metadata (resolution, format, filesizes), and total processing time.
    """
    start_time = time.time()
    
    # Generate unique prefixes
    base_name = os.path.basename(input_path)
    file_id = os.path.splitext(base_name)[0]
    
    # Determine outputs
    enhanced_path = os.path.join(output_dir, f"{file_id}_enhanced.png")
    colorized_path = os.path.join(output_dir, f"{file_id}_colorized.png")
    original_web_path = os.path.join(output_dir, f"{file_id}_original.png")
    
    # ----------------------------------------------------
    # Step 1: Load and Format
    # ----------------------------------------------------
    if progress_callback:
        progress_callback(15, "Loading and normalising image...")
    await asyncio.sleep(0.3) # Simulate processing pacing for live progress feel
    
    # Read image (handles grayscale, RGB, alpha, TIFF etc.)
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError("Could not read uploaded image file. It may be corrupted.")
        
    # Downscale extremely large images to prevent Out-of-Memory (OOM) crashes on 512MB RAM free hosting tiers
    max_dim = 1000
    h, w = img.shape[:2]
    if max(h, w) > max_dim:
        scale_ratio = max_dim / max(h, w)
        img = cv2.resize(img, (int(w * scale_ratio), int(h * scale_ratio)), interpolation=cv2.INTER_AREA)
        
    # Check channels
    if len(img.shape) == 2:
        # Grayscale IR image - normalize to BGR representation
        img_bgr = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
        gray = img
    elif img.shape[2] == 4:
        # RGBA - drop alpha
        img_bgr = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    else:
        img_bgr = img
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
    # Save original converted to web-friendly PNG format
    cv2.imwrite(original_web_path, img_bgr)
    
    # Get original metadata
    orig_height, orig_width = img_bgr.shape[:2]
    
    # ----------------------------------------------------
    # Step 2: Noise Removal
    # ----------------------------------------------------
    if progress_callback:
        progress_callback(30, "Removing sensor speckle and Gaussian noise...")
    await asyncio.sleep(0.3)
    
    denoised = noise_removal(gray)
    
    # ----------------------------------------------------
    # Step 3: Contrast Enhancement
    # ----------------------------------------------------
    if progress_callback:
        progress_callback(45, "Applying CLAHE contrast equalization...")
    await asyncio.sleep(0.3)
    
    contrast_eq = contrast_enhancement(denoised)
    
    # ----------------------------------------------------
    # Step 4: AI Super Resolution
    # ----------------------------------------------------
    if progress_callback:
        progress_callback(65, "Executing PyTorch Super Resolution neural network...")
    await asyncio.sleep(0.4)
    
    # Feed the 3-channel version of contrast enhanced gray into enhancer
    eq_bgr = cv2.cvtColor(contrast_eq, cv2.COLOR_GRAY2BGR)
    enhanced = enhancer.enhance(eq_bgr, scale=1.5)
    
    # Save enhanced image
    cv2.imwrite(enhanced_path, enhanced)
    
    # ----------------------------------------------------
    # Step 5: Neural Colorization
    # ----------------------------------------------------
    if progress_callback:
        progress_callback(80, "Performing deep colorization on enhanced infrared mapping...")
    await asyncio.sleep(0.4)
    
    # Extract grey channel of enhanced image for colorizer
    enhanced_gray = cv2.cvtColor(enhanced, cv2.COLOR_BGR2GRAY)
    colorized = colorizer.colorize(enhanced_gray)
    
    # ----------------------------------------------------
    # Step 6: Edge Preservation
    # ----------------------------------------------------
    if progress_callback:
        progress_callback(95, "Applying bilateral filter edge preservation...")
    await asyncio.sleep(0.3)
    
    final_colorized = edge_preserving_filter(colorized)
    
    # Save colorized image
    cv2.imwrite(colorized_path, final_colorized)
    
    # ----------------------------------------------------
    # Step 7: Finalizing & Metadata Extraction
    # ----------------------------------------------------
    if progress_callback:
        progress_callback(100, "Processing complete! Structuring response.")
    
    processing_time = round(time.time() - start_time, 3)
    
    # Metadata dictionary for frontend EXIF presentation
    enhanced_height, enhanced_width = enhanced.shape[:2]
    metadata = {
        "original_resolution": f"{orig_width}x{orig_height}",
        "enhanced_resolution": f"{enhanced_width}x{enhanced_height}",
        "channels": 3,
        "input_format": os.path.splitext(input_path)[1].upper()[1:],
        "original_size_kb": round(os.path.getsize(input_path) / 1024, 2),
        "enhanced_size_kb": round(os.path.getsize(enhanced_path) / 1024, 2),
        "colorized_size_kb": round(os.path.getsize(colorized_path) / 1024, 2),
    }
    
    result = {
        "original": f"/static/uploads/{os.path.basename(original_web_path)}",
        "enhanced": f"/static/uploads/{os.path.basename(enhanced_path)}",
        "colorized": f"/static/uploads/{os.path.basename(colorized_path)}",
        "metadata": metadata
    }
    
    return result, processing_time
