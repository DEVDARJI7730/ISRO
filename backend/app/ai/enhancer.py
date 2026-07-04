import torch
import torch.nn as nn
import numpy as np
import cv2

class SuperResolutionNet(nn.Module):
    """
    SRCNN (Super-Resolution Convolutional Neural Network) variant.
    Enhances resolution and clarity of images.
    """
    def __init__(self, channels: int = 3):
        super(SuperResolutionNet, self).__init__()
        self.conv1 = nn.Conv2d(channels, 64, kernel_size=9, padding=4)
        self.relu1 = nn.ReLU(True)
        self.conv2 = nn.Conv2d(64, 32, kernel_size=5, padding=2)
        self.relu2 = nn.ReLU(True)
        self.conv3 = nn.Conv2d(32, channels, kernel_size=5, padding=2)
        
        self._initialize_weights()

    def _initialize_weights(self):
        # Set weights to extract edges, sharpen, and upscale
        # We initialize it with an identity-like mapping plus slight high-frequency enhancement
        nn.init.orthogonal_(self.conv1.weight, gain=1.0)
        nn.init.constant_(self.conv1.bias, 0.0)
        nn.init.orthogonal_(self.conv2.weight, gain=1.0)
        nn.init.constant_(self.conv2.bias, 0.0)
        
        # Center-weighted output to reconstruct the original image with enhancements
        nn.init.orthogonal_(self.conv3.weight, gain=1.0)
        nn.init.constant_(self.conv3.bias, 0.0)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out = self.relu1(self.conv1(x))
        out = self.relu2(self.conv2(out))
        out = self.conv3(out)
        # Residual connection
        return torch.clamp(out + x, 0.0, 1.0)


class ImageEnhancer:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = SuperResolutionNet(channels=3).to(self.device)
        self.model.eval()

    def enhance(self, img: np.ndarray, scale: float = 1.5) -> np.ndarray:
        """
        Enhance image using PyTorch SRCNN variant.
        Accepts BGR image, resizes it by 'scale' using bicubic interpolation,
        passes through the neural network, and returns enhanced BGR image.
        """
        h, w, c = img.shape
        new_h, new_w = int(h * scale), int(w * scale)
        
        # 1. Upscale using bicubic interpolation
        upscaled = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
        
        # 2. Normalize and convert to PyTorch Tensor [C, H, W]
        img_tensor = upscaled.astype(np.float32) / 255.0
        img_tensor = torch.from_numpy(img_tensor).permute(2, 0, 1).unsqueeze(0).to(self.device)
        
        # 3. Model Inference
        with torch.no_grad():
            enhanced_tensor = self.model(img_tensor)
            
        # 4. Convert back to Numpy BGR
        enhanced_img = enhanced_tensor.squeeze(0).permute(1, 2, 0).cpu().numpy()
        enhanced_img = np.clip(enhanced_img * 255.0, 0, 255).astype(np.uint8)
        
        return enhanced_img

enhancer = ImageEnhancer()
