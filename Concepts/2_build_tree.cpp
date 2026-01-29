#include <iostream>
using namespace std;

class Node {
public:
    int data;
    Node* lchild;
    Node* rchild;
};

Node* createNode(int value) {
    Node* temp = new Node();
    temp->data = value;
    temp->lchild = NULL;
    temp->rchild = NULL;
    return temp;
}

int main() {
    Node* root = NULL;
    char choice;

    do {
        int value;
        cout << "Enter node data: ";
        cin >> value;

        Node* temp = createNode(value);

        // Step 2: If tree is empty
        if (root == NULL) {
            root = temp;
            cout << "Root node created.\n";
        } else {
            Node* ptr = root;
            char dir;

            // Repeat until node gets attached
            while (true) {
                cout << "Enter direction (l/r): ";
                cin >> dir;

                if (dir == 'l') {
                    if (ptr->lchild == NULL) {
                        ptr->lchild = temp;
                        break;
                    } else {
                        ptr = ptr->lchild;
                    }
                } else if (dir == 'r') {
                    if (ptr->rchild == NULL) {
                        ptr->rchild = temp;
                        break;
                    } else {
                        ptr = ptr->rchild;
                    }
                } else {
                    cout << "Invalid direction! Use l or r.\n";
                }
            }
        }

        cout << "Do you want to add more nodes? (y/n): ";
        cin >> choice;

    } while (choice == 'y');

    return 0;
}
