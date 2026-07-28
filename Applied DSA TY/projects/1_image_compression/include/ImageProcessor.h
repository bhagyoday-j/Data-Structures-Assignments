#ifndef IMAGEPROCESSOR_H
#define IMAGEPROCESSOR_H

#include <opencv2/core.hpp>
#include <opencv2/highgui.hpp>
#include <string>

/**
 * @brief Handles image loading, saving, and quality metric computations.
 * 
 * Provides utility functions for:
 * - Loading images from disk
 * - Saving images to disk
 * - Computing Mean Squared Error (MSE)
 * - Computing Peak Signal-to-Noise Ratio (PSNR)
 * - Generating difference images
 * - Displaying results in an OpenCV window
 */
class ImageProcessor {
public:
    ImageProcessor() = default;

    /**
     * @brief Loads an image from the specified path.
     * 
     * @param path File path to the image (PNG, JPG, etc.)
     * @return cv::Mat Loaded image (8-bit, 3-channel BGR)
     * @throws std::runtime_error If the image cannot be loaded
     */
    cv::Mat loadImage(const std::string& path) const;

    /**
     * @brief Saves an image to the specified path.
     * 
     * @param path Output file path
     * @param image Image data to save
     */
    void saveImage(const std::string& path, const cv::Mat& image) const;

    /**
     * @brief Computes the Mean Squared Error between two images.
     * 
     * MSE = (1 / (M * N)) * sum((original - compressed)^2)
     * 
     * @param original Original image
     * @param compressed Compressed/reconstructed image
     * @return double MSE value
     * @throws std::invalid_argument If images have different dimensions
     */
    double computeMSE(const cv::Mat& original, const cv::Mat& compressed) const;

    /**
     * @brief Computes the Peak Signal-to-Noise Ratio.
     * 
     * PSNR = 10 * log10(MAX^2 / MSE)
     * where MAX = 255 for 8-bit images
     * 
     * @param mse Mean Squared Error value
     * @return double PSNR value in decibels (dB)
     */
    double computePSNR(double mse) const;

    /**
     * @brief Generates a difference image highlighting pixel disparities.
     * 
     * Each pixel = |original - compressed| scaled for visibility.
     * 
     * @param original Original image
     * @param compressed Compressed/reconstructed image
     * @return cv::Mat Difference image
     */
    cv::Mat computeDifferenceImage(const cv::Mat& original, 
                                   const cv::Mat& compressed) const;

    /**
     * @brief Resizes an image to fit within the specified dimensions while
     *        maintaining aspect ratio.
     * 
     * @param image Input image
     * @param maxWidth  Maximum width
     * @param maxHeight Maximum height
     * @return cv::Mat Resized image
     */
    cv::Mat resizeToFit(const cv::Mat& image, int maxWidth, int maxHeight) const;

    /**
     * @brief Creates a combined display with original, compressed, and difference images.
     * 
     * @param original    Original image
     * @param compressed  Compressed/reconstructed image
     * @param difference  Difference image
     * @param stats       Compression statistics text
     * @return cv::Mat    Combined display image
     */
    cv::Mat createDisplay(const cv::Mat& original, 
                          const cv::Mat& compressed,
                          const cv::Mat& difference,
                          const std::string& stats) const;
};

#endif // IMAGEPROCESSOR_H
