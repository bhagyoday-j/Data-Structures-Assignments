#ifndef STATISTICS_H
#define STATISTICS_H

#include <string>
#include <sstream>
#include <iomanip>
#include <cstddef>

/**
 * @brief Stores compression statistics for the QuadTree algorithm.
 * 
 * Tracks all relevant metrics to evaluate compression performance
 * and algorithm efficiency.
 */
struct Statistics {
    // Image properties
    int originalWidth = 0;          ///< Width of original image in pixels
    int originalHeight = 0;         ///< Height of original image in pixels
    int channels = 0;               ///< Number of color channels
    size_t originalSizeBytes = 0;   ///< Raw size of original image in bytes
    size_t totalPixels = 0;         ///< Total number of pixels

    // QuadTree properties
    int totalNodes = 0;             ///< Total number of nodes in the QuadTree
    int leafNodes = 0;              ///< Number of leaf nodes
    int maxDepth = 0;               ///< Maximum recursion depth

    // Compression metrics
    double compressionRatio = 0.0;  ///< Ratio of compressed size to original size
    size_t compressedSizeBytes = 0; ///< Estimated memory used by QuadTree

    // Quality metrics
    double mse = 0.0;               ///< Mean Squared Error
    double psnr = 0.0;              ///< Peak Signal-to-Noise Ratio (dB)

    // Performance
    double buildTimeMs = 0.0;       ///< Time to build the QuadTree
    double reconstructTimeMs = 0.0; ///< Time to reconstruct the image

    // Threshold used
    int threshold = 0;              ///< Uniformity threshold used

    /**
     * @brief Returns a formatted string with all compression statistics.
     * 
     * @return std::string Multi-line formatted statistics
     */
    std::string toString() const {
        std::ostringstream oss;
        oss << std::fixed << std::setprecision(2);
        
        oss << "========== COMPRESSION STATISTICS ==========\n";
        oss << "Original Image: " << originalWidth << "x" << originalHeight 
            << " (" << channels << " channels)\n";
        oss << "Total Pixels: " << totalPixels << "\n";
        oss << "Raw Size: " << formatBytes(originalSizeBytes) << "\n";
        oss << "Threshold: " << threshold << "\n";
        oss << "-------------------------------------------\n";
        oss << "QuadTree Nodes: " << totalNodes << "\n";
        oss << "Leaf Nodes: " << leafNodes << "\n";
        oss << "Max Recursion Depth: " << maxDepth << "\n";
        oss << "Compressed Size: " << formatBytes(compressedSizeBytes) << "\n";
        oss << "Compression Ratio: " << compressionRatio << "x\n";
        oss << "-------------------------------------------\n";
        oss << "Build Time: " << buildTimeMs << " ms\n";
        oss << "Reconstruct Time: " << reconstructTimeMs << " ms\n";
        oss << "-------------------------------------------\n";
        oss << "MSE: " << mse << "\n";
        oss << "PSNR: " << psnr << " dB\n";
        oss << "===========================================\n";
        
        return oss.str();
    }

    /**
     * @brief Formats bytes into a human-readable string.
     * 
     * @param bytes Size in bytes
     * @return std::string Formatted string (e.g., "1.23 MB")
     */
    static std::string formatBytes(size_t bytes) {
        const char* units[] = {"B", "KB", "MB", "GB"};
        int unitIndex = 0;
        double size = static_cast<double>(bytes);
        
        while (size >= 1024.0 && unitIndex < 3) {
            size /= 1024.0;
            unitIndex++;
        }
        
        std::ostringstream oss;
        oss << std::fixed << std::setprecision(2) << size << " " << units[unitIndex];
        return oss.str();
    }
};

#endif // STATISTICS_H
