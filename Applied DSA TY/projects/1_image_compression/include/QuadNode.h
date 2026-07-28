#ifndef QUADNODE_H
#define QUADNODE_H

#include <opencv2/core.hpp>
#include <memory>

/**
 * @brief Represents a single node in the QuadTree.
 * 
 * Each node stores the average color of its region and pointers to its
 * four children (topLeft, topRight, bottomLeft, bottomRight).
 * A leaf node represents a uniform region that requires no further subdivision.
 * 
 * This class is the fundamental building block of the Divide-and-Conquer
 * image compression algorithm.
 */
class QuadNode {
public:
    /**
     * @brief Constructs a leaf QuadNode.
     * 
     * @param x         X-coordinate of the top-left corner in the image
     * @param y         Y-coordinate of the top-left corner in the image
     * @param width     Width of the region
     * @param height    Height of the region
     * @param color     Average BGR color of the region
     */
    QuadNode(int x, int y, int width, int height, const cv::Vec3b& color);

    /// Destructor (default is fine since we use unique_ptr for children)
    ~QuadNode() = default;

    // Prevent copying (unique_ptr members can't be copied easily)
    QuadNode(const QuadNode&) = delete;
    QuadNode& operator=(const QuadNode&) = delete;

    // Allow move semantics
    QuadNode(QuadNode&&) = default;
    QuadNode& operator=(QuadNode&&) = default;

    // --- Accessors ---

    bool isLeaf() const { return leaf_; }
    const cv::Vec3b& getColor() const { return color_; }
    int getX() const { return x_; }
    int getY() const { return y_; }
    int getWidth() const { return width_; }
    int getHeight() const { return height_; }

    // --- Child accessors ---

    const QuadNode* getTopLeft() const { return topLeft_.get(); }
    const QuadNode* getTopRight() const { return topRight_.get(); }
    const QuadNode* getBottomLeft() const { return bottomLeft_.get(); }
    const QuadNode* getBottomRight() const { return bottomRight_.get(); }

    QuadNode* getTopLeft() { return topLeft_.get(); }
    QuadNode* getTopRight() { return topRight_.get(); }
    QuadNode* getBottomLeft() { return bottomLeft_.get(); }
    QuadNode* getBottomRight() { return bottomRight_.get(); }

    // --- Child setters ---

    void setTopLeft(std::unique_ptr<QuadNode> child);
    void setTopRight(std::unique_ptr<QuadNode> child);
    void setBottomLeft(std::unique_ptr<QuadNode> child);
    void setBottomRight(std::unique_ptr<QuadNode> child);

    /**
     * @brief Returns the number of leaves in the subtree rooted at this node.
     */
    int countLeaves() const;

    /**
     * @brief Returns the total number of nodes in the subtree rooted at this node.
     */
    int countNodes() const;

    /**
     * @brief Returns the maximum depth of the subtree rooted at this node.
     * 
     * @param currentDepth Depth of this node (used during recursion)
     */
    int getMaxDepth(int currentDepth = 1) const;

private:
    bool leaf_;                     ///< Whether this node is a leaf
    cv::Vec3b color_;              ///< Average BGR color of the region
    int x_, y_;                     ///< Top-left coordinates
    int width_, height_;            ///< Dimensions of the region

    // Four children (Divide-and-Conquer: split region into quadrants)
    std::unique_ptr<QuadNode> topLeft_;
    std::unique_ptr<QuadNode> topRight_;
    std::unique_ptr<QuadNode> bottomLeft_;
    std::unique_ptr<QuadNode> bottomRight_;
};

#endif // QUADNODE_H
