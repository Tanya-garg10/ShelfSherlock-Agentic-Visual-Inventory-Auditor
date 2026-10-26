import cv2
import numpy as np

def compute_sharpness(image_gray: np.ndarray) -> float:
    """Computes the variance of the Laplacian as a measure of image focus/blur."""
    laplacian = cv2.Laplacian(image_gray, cv2.CV_64F)
    return float(laplacian.var())

def compute_psnr(img1: np.ndarray, img2: np.ndarray) -> float:
    """Computes Peak Signal-to-Noise Ratio between two images."""
    mse = np.mean((img1.astype(np.float64) - img2.astype(np.float64)) ** 2)
    if mse == 0:
        return 100.0
    max_pixel = 255.0
    return float(20 * np.log10(max_pixel / np.sqrt(mse)))

def compute_ssim(img1_gray: np.ndarray, img2_gray: np.ndarray) -> float:
    """Computes Mean Structural Similarity Index (SSIM) between two single-channel images."""
    C1 = (0.01 * 255) ** 2
    C2 = (0.03 * 255) ** 2

    img1 = img1_gray.astype(np.float64)
    img2 = img2_gray.astype(np.float64)

    kernel = cv2.getGaussianKernel(11, 1.5)
    window = np.outer(kernel, kernel.transpose())

    mu1 = cv2.filter2D(img1, -1, window)[5:-5, 5:-5]
    mu2 = cv2.filter2D(img2, -1, window)[5:-5, 5:-5]

    mu1_sq = mu1 ** 2
    mu2_sq = mu2 ** 2
    mu1_mu2 = mu1 * mu2

    sigma1_sq = cv2.filter2D(img1 ** 2, -1, window)[5:-5, 5:-5] - mu1_sq
    sigma2_sq = cv2.filter2D(img2 ** 2, -1, window)[5:-5, 5:-5] - mu2_sq
    sigma12 = cv2.filter2D(img1 * img2, -1, window)[5:-5, 5:-5] - mu1_mu2

    ssim_map = ((2 * mu1_mu2 + C1) * (2 * sigma12 + C2)) / ((mu1_sq + mu2_sq + C1) * (sigma1_sq + sigma2_sq + C2))
    return float(np.clip(ssim_map.mean(), -1.0, 1.0))

def compute_normalized_correlation(img1_gray: np.ndarray, img2_gray: np.ndarray) -> float:
    """Computes normalized cross-correlation between two images."""
    res = cv2.matchTemplate(img1_gray, img2_gray, cv2.TM_CCORR_NORMED)
    return float(res[0][0])
