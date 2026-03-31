#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

class Node {
  public:
    int id;
    string name;
    Node* left;
    Node* right;

    Node(int id, string name){
      left = NULL;
      right = NULL;
      this->id = id;
      this->name = name;
    }
};

void addNode(Node*& root) {
  int id;
  string name;

  cout << "Enter id : ";
  cin >> id;
  cout << "Enter name : ";
  cin >> name;
  
  Node* newNode = new Node(id, name);
  
  if(root == NULL) {
    root = newNode;
    cout << "Root Node created" << endl;
  } else {
    char ch;
    Node* ptr = root;

    while(true) {
      cout << "Enter left or right (l or r) : ";
      cin >> ch;
      
      if(ch == 'l') {
        if(ptr->left == NULL) {
          ptr->left = newNode;
          break;
        } else {
          ptr = ptr->left;
        }
      } else if(ch == 'r') {
        if(ptr->right == NULL) {
          ptr->right = newNode;
          break;
        } else {
          ptr = ptr->right;
        }
      } else {
        cout << "You enter wrong choice" << endl;
      }
    }
  }
}

void inorder(Node* root) {
  if(root == NULL) return;

  inorder(root->left);
  cout << root->id << " " << root->name << endl;
  inorder(root->right);
}

void preorder(Node* root) {
  if(root == NULL) return;

  cout << root->id << " " << root->name << endl;
  preorder(root->left);
  preorder(root->right);
}

void postorder(Node* root) {
  if(root == NULL) return;

  postorder(root->left);
  postorder(root->right);
  cout << root->id << " " << root->name << endl;
}

bool search(Node* root, int id) {
  if(root == NULL) return false;

  if(root->id == id) return true;

  return search(root->left, id) || search(root->right, id);
}

int height(Node* root) {
  if(root == NULL) return -1;

  return max(height(root->left), height(root->right)) + 1;
}

void leaf_nodes(Node* root) {
  if(root == NULL) return;

  if(root->left == NULL && root->right == NULL) {
    cout << root->id << " ";
    return;
  }

  leaf_nodes(root->left);
  leaf_nodes(root->right);
}


void siblings(Node* root) {
  if(root == NULL) return;

  if(root->right != NULL && root->left != NULL) {
    cout << root->left->id << " and " << root->right->id << " are siblings" << endl;
  }

  siblings(root->left);
  siblings(root->right);
}

int main() {

  bool F = true;
  Node* root = NULL;

  while(F) {
    int ch;
    cin >> ch;
    switch(ch) {
      case 1:
            addNode(root);
            break;
      case 2:
            inorder(root);
            break;
      case 3:
            cout << height(root);
            break;
      case 4:
            F = false;
            break;
    }
  }
  return 0;
}