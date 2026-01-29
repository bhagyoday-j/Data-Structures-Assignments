#include <iostream>
#include <stack>
using namespace std;

class Node {
public:
    string name;
    string aadharNo;
    int age;
    Node* lchild;
    Node* rchild;

    Node() {
        name = "";
        aadharNo = "";
        age = 0;
        lchild = NULL;
        rchild = NULL;
    }
};

Node* createNode(int Age, string Name, string AadharNo) {
    Node* temp = new Node();
    temp->age = Age;
    temp->name = Name;
    temp->aadharNo = AadharNo;
    temp->lchild = NULL;
    temp->rchild = NULL;
    return temp;
}

void tree(Node*& root) {
    char choice = 'y';

    do {
        int age;
        cout << "Enter fimily member age: ";
        cin >> age;

        cout << "Enter fimily member name: ";
        string name;
        cin >> name;

        cout << "Enter fimily member aadharNo: ";
        string aadharNo;
        cin >> aadharNo;

        Node* temp = createNode(age, name, aadharNo);

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


void inorder(Node* root) {
  stack<Node*> s;
  Node* temp = root;

  cout << "Inorder : " << endl;

  while(!s.empty() || temp != NULL) {
    while(temp != NULL) {
      s.push(temp);
      temp = temp -> lchild;
    }

    temp = s.top();
    s.pop();

    cout << "age: " << temp -> age << ", name: " << temp -> name << ", aadharNo: " << temp -> aadharNo << endl;
    temp = temp -> rchild;
  }

  cout << endl << endl;
}

void preorder(Node* root) {
    if (root == NULL) return;

    stack<Node*> s;
    Node* temp = root;

    cout << "Preorder : " << endl;

    while (temp != NULL || !s.empty()) {
        while (temp != NULL) {
            cout << "age: " << temp -> age << ", name: " << temp -> name << ", aadharNo: " << temp -> aadharNo << endl;

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

    cout << endl << endl;
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

    cout << "Postorder : " << endl;
    while (!s2.empty()) {
        cout << "age: " << s2.top()->age << ", name: " << s2.top()->name << ", aadharNo: " << s2.top()->aadharNo << endl;
        s2.pop();
    }
    cout << endl << endl;
}

void search(Node* root) {
    string Aadhar;
    cout << "Enter aadharNo to search: ";
    cin >> Aadhar;

    if (root == NULL) return;

    stack<Node*> s;
    Node* temp = root;

    while (temp != NULL || !s.empty()) {
        while (temp != NULL) {
            if(temp->aadharNo == Aadhar) {
                cout << "Found member with aadharNo: " << Aadhar << endl;
                cout << "age: " << temp -> age << ", name: " << temp -> name << ", aadharNo: " << temp -> aadharNo << endl;
                return;
            }

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

    cout << "Member with aadharNo: " << Aadhar << " not found." << endl;

    cout << endl << endl;
}

int height(Node* root) {
    if (root == NULL) {
        return -1;
    } 
    else {
        int lheight = height(root->lchild);
        int rheight = height(root->rchild);

        return max(lheight, rheight) + 1;
    }
}

void leaf_node(Node* root) {
    if (root == NULL) return;

    if (root->lchild == NULL && root->rchild == NULL) {
        cout << "age: " << root->age << ", name: " << root->name << ", aadharNo: " << root->aadharNo << endl;
        return;
    }

    if (root->lchild != NULL) {
        leaf_node(root->lchild);
    }

    if (root->rchild != NULL) {
        leaf_node(root->rchild);
    }
}

void siblings(Node* root) {
    if (root == NULL) return;

    if (root->lchild != NULL && root->rchild != NULL) {
        cout << "Siblings: " << root->lchild->name << " and " << root->rchild->name << endl;
    }

    siblings(root->lchild);
    siblings(root->rchild);
}

void ancestors(Node* root) {
    cout << "Ancestor of is : ";
    cout << "age: " << root->age << ", name: " << root->name << ", aadharNo: " << root->aadharNo << endl;
}

bool isExistInTree(Node* root, string target) {
    if(root == NULL)
        return false;

    if(root->aadharNo == target)
        return true;

    return isExistInTree(root->lchild, target) ||
           isExistInTree(root->rchild, target);
}


void completeAncestors(Node* root, string target) {
    if(root == NULL) return;
    
    cout << root->name << "->";

    if(isExistInTree(root->lchild, target)) {
        completeAncestors(root->lchild, target);
    }

    if(isExistInTree(root->rchild, target)) {
        completeAncestors(root->rchild, target);
    }
}

int main() {
    Node* root1 = NULL;
    tree(root1);

    bool F = true;

    while (F) {
        int ch;
        cout << "Enter : \n1: Inorder\n2: Preorder\n3: Postorder\n4: search\n5: Number of Generations\n6: Leaf Nodes\n7: Siblings\n8: Ancestor\n9: Height of Family tree\n10: All Ancestors of family member\n11: Exit\n";
        cin >> ch;

        switch (ch) {
            case 1:
                inorder(root1);
                break;
            case 2:
                preorder(root1);
                break;
            case 3:
                postorder(root1);
                break;
            case 4:
                search(root1);
                break;
            case 5:
                cout << "Generations of family tree  : " << height(root1) + 1 << endl << endl;
                break;
            case 6:
                cout << "Current generation is : " << endl;
                leaf_node(root1);
                cout << endl << endl;
                break;
            case 7:
                siblings(root1);
                cout << endl << endl;
                break;
            case 8:
                ancestors(root1);
                break;
            case 9:
                cout << "Height of family tree  : " << height(root1) << endl << endl;
                break;
            case 10:
                cout << "Enter aadharNo to find all ancestors: ";
                {
                    string Aadhar;
                    cin >> Aadhar;

                    cout << "Ancestors of " << Aadhar << " are: ";
                    completeAncestors(root1, Aadhar);
                    cout << "Continue..." << endl << endl;
                }
                break;
            case 11:
                F = false;
                break;
            default:
                cout << "Invalid choice! Please try again.\n";
        }
    }

    return 0;
}
