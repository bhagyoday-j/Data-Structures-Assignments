#include <iostream>
#include <stack>
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

void tree(Node*& root) {
    char choice;

    do {
        int value;
        cout << "Enter node data: ";
        cin >> value;

        Node* temp = createNode(value);

        if (root == NULL) {
            root = temp;
            cout << "Root node created.\n";
        } else {
            Node* ptr = root;
            char dir;

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
                } 
                else if (dir == 'r') {
                    if (ptr->rchild == NULL) {
                        ptr->rchild = temp;
                        break;
                    } else {
                        ptr = ptr->rchild;
                    }
                } 
                else {
                    cout << "Invalid direction! Use l or r.\n";
                }
            }
        }

        cout << "Do you want to add more nodes? (y/n): ";
        cin >> choice;

    } while (choice == 'y');
}

int height(Node* root) {
  if(root == NULL) return -1;

  int left = height(root->lchild);
  int right = height(root->rchild);

  return max(left, right) + 1;
}

void leaf_node(Node* root) {
  if(root == NULL) return;

  if(root->lchild == NULL && root->rchild == NULL) {
    cout << root->data << " ";
    return;
  }

  if(root->lchild != NULL) {
    leaf_node(root->lchild);
  }

  if(root->rchild != NULL) {
    leaf_node(root->rchild);
  }
}

void inorder(Node* root) {
  stack<Node*> s;
  Node* temp = root;

  cout << "Inorder : ";

  while(!s.empty() || temp != NULL) {
    while(temp != NULL) {
      s.push(temp);
      temp = temp -> lchild;
    }

    temp = s.top();
    s.pop();

    cout << temp -> data << " ";
    temp = temp -> rchild;
  }

  cout << endl;
}

void preorder(Node* root) {
    if (root == NULL) return;

    stack<Node*> s;
    Node* temp = root;

    cout << "Preorder : ";

    while (temp != NULL || !s.empty()) {
        while (temp != NULL) {
            cout << temp->data << " ";

            if (temp->rchild != NULL) {
                s.push(temp->rchild);
            }

            temp = temp->lchild;
        }

        if (!s.empty()) {
            temp = s.top();
            s.pop();
        }
    }

    cout << endl;
}

void postorder(Node* root) {
    if (root == NULL) return;

    stack<Node*> s1, s2;
    s1.push(root);

    while (!s1.empty()) {
        Node* temp = s1.top();
        s1.pop();
        s2.push(temp);

        if (temp->lchild)
            s1.push(temp->lchild);
        if (temp->rchild)
            s1.push(temp->rchild);
    }

    cout << "Postorder : ";
    while (!s2.empty()) {
        cout << s2.top()->data << " ";
        s2.pop();
    }
    cout << endl;
}


int main() {
    Node* root1 = NULL;
    tree(root1);

    cout << "Height of tree is : " << height(root1) << endl;

    cout << "Leaf Nodes are : " ; 
    leaf_node(root1);
    cout << endl;

    inorder(root1);
    preorder(root1);
    postorder(root1);

    return 0;
}
