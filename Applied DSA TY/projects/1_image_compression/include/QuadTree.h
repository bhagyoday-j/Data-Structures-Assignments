#ifndef QUADTREE_H
#define QUADTREE_H

#include "QuadNode.h"
#include "Statistics.h"
#include <opencv2/core.hpp>
#include <string>
#include <chrono>

/**
 * @brief QuadTree image compression using Divide and Conquer.
 * 
 * The QuadTree recursively divides an image into four equal quadrants.
 * If a region is sufficiently uniform (below a threshold), it becomes a leaf
 * node storing the average color. Otherwise, it splits into four children.
 * 
 * This is a classic Divide-and-Conquer algorithm:
 * - Divide: Split the image region into 4 equal quadrants
 * - Conquer: Recursively process each quadrant
 * - Combine: Store the results as children of the current node
 */
class QuadTree {
public:
    /**
     * @brief Constructs a QuadTree from an image.
     * 
     * @param image     Source image (must be 8-bit, 3-channel BGR)
     * @param threshold Maximum color difference for a region to be uniform
     */
    QuadTree(const cv::Mat& image, int threshold);

    /// Destructor
    ~QuadTree() = default;

    // No copy/move needed
    QuadTree(const QuadTree&) = delete;
    QuadTree& operator=(const QuadTree&) = delete;

    /**
     * @brief Reconstructs the compressed image from the QuadTree.
     * 
     * @return cv::Mat The reconstructed (compressed) image
     */
    cv::Mat reconstruct() const;

    /**
     * @brief Returns compression statistics.
     */
    const Statistics& getStatistics() const { return stats_; }

    /**
     * @brief Returns the root node (const access).
     */
    const QuadNode* getRoot() const { return root_.get(); }

    /**
     * @brief Exports the QuadTree structure as a JSON string.
     */
    std::string toJson() const;

    /**
     * @brief Exports the QuadTree structure as an XML string.
     */
    std::string toXml() const;

    /**
     * @brief Returns the threshold used for compression.
     */
    int getThreshold() const { return threshold_; }

    /**
     * @brief Generates a visualization of the QuadTree partition lines.
     * 
     * @param width  Width of the output visualization image
     * @param height Height of the output visualization image
     * @return cv::Mat Visualization image with partition boundaries drawn
     */
    cv::Mat visualizePartitions(int width, int height) const;

private:
    /**
     * @brief Recursively builds the QuadTree using Divide and Conquer.
     * 
     * This is the core algorithm:
     * 
     * 1. BASE CASE: If the region is uniform (below threshold), create a leaf node.
     * 2. DIVIDE: Split the region into four equal quadrants.
     * 3. CONQUER: Recursively build QuadTrees for each quadrant.
     * 4. COMBINE: Create a non-leaf node with the four children.
     * 
     * @param image  Source image data
     * @param x      X-coordinate of region top-left
     * @param y      Y-coordinate of region top-left
     * @param w      Width of region
     * @param h      Height of region
     * @param depth  Current recursion depth (for tracking max depth)
     * @return std::unique_ptr<QuadNode> Root node of the subtree
     */
    std::unique_ptr<QuadNode> buildQuadTree(const cv::Mat& image, 
                                            int x, int y, int w, int h, 
                                            int depth);

    /**
     * @brief Checks if a region is uniform enough to be a leaf.
     * 
     * Computes the maximum pairwise Euclidean distance between any pixel
     * color in the region and the average color. If below threshold, uniform.
     * 
     * @param image  Source image
     * @param x      X-coordinate of region top-left
     * @param y      Y-coordinate of region top-left
     * @param w      Width of region
     * @param h      Height of region
     * @param avg    Average BGR color of the region (output)
     * @return true  If the region is uniform (max diff <= threshold)
     * @return false If the region needs further subdivision
     */
    bool isUniform(const cv::Mat& image, int x, int y, int w, int h, 
                   cv::Vec3b& avg) const;

    /**
     * @brief Recursively fills pixel data from QuadTree during reconstruction.
     * 
     * @param node   Current QuadNode
     * @param output Output image to fill
     */
    void reconstructNode(const QuadNode* node, cv::Mat& output) const;

    /**
     * @brief Recursively serializes QuadTree to JSON.
     */
    void nodeToJson(const QuadNode* node, std::string& json, int depth) const;

    /**
     * @brief Recursively serializes QuadTree to XML.
     */
    void nodeToXml(const QuadNode* node, std::string& xml, int depth) const;

    /**
     * @brief Recursively draws partition lines for visualization.
     */
    void drawPartitions(const QuadNode* node, cv::Mat& canvas, int imgW, int imgH) const;

    // Member variables
    std::unique_ptr<QuadNode> root_;    ///< Root node of the QuadTree
    int threshold_;                      ///< Uniformity threshold
    int imageWidth_;                     ///< Width of the original image
    int imageHeight_;                    ///< Height of the original image
    Statistics stats_;                   ///< Compression statistics
};

#endif // QUADTREE_H
