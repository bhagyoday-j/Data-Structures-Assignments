#include <iostream>
#include <stack>
using namespace std;

class Node {
public:
    string name;
    int id;
    int salary;
    string position;
    string dateOfJoining;

    Node* lchild;
    Node* rchild;

    Node() {
        name = "";
        id = 0; 
        salary = 0;
        position = "";
        dateOfJoining = "";

        lchild = NULL;
        rchild = NULL;
    }
};

Node* createNode(int Id, string Name, int Salary, string Position, string DateOfJoining) {
    Node* temp = new Node();
    temp->id = Id;
    temp->name = Name;
    temp->salary = Salary;
    temp->position = Position;
    temp->dateOfJoining = DateOfJoining;

    temp->lchild = NULL;
    temp->rchild = NULL;
    return temp;
}

void tree(Node*& root) {
    char choice = 'n';

    do {
        int id;
        cout << "Enter employee ID: ";
        cin >> id;

        cout << "Enter employee name: ";
        string name;
        cin >> name;

        cout << "Enter employee salary: ";
        int salary;
        cin >> salary;

        cout << "Enter employee position: ";
        string position;
        cin >> position;

        cout << "Enter date of joining: ";
        string dateOfJoining;
        cin >> dateOfJoining;

        Node* temp = createNode(id, name, salary, position, dateOfJoining);

        if (root == NULL) {
            root = temp;
            cout << "Root node created.\n";
        } else {
            Node* ptr = root;

            while (ptr != NULL) {
                if(ptr->salary >= temp->salary) {
                    if(ptr->lchild == NULL) {
                        ptr->lchild = temp;
                        break;
                    } else {
                        ptr = ptr->lchild;
                    }
                } else {
                    if(ptr->rchild == NULL) {
                        ptr->rchild = temp;
                        break;
                    } else {
                        ptr = ptr->rchild;
                    }
                }
            }
        }

        cout << "Do you want to add more nodes? (y/n): ";
        cin >> choice;        

    } while (choice == 'y');
    
}

void inorder(Node* root) {
    if (root == NULL) {
        return;
    }

    inorder(root->lchild);
    cout << "ID: " << root->id << ", Name: " << root->name << ", Salary: " << root->salary 
         << ", Position: " << root->position << ", Date of Joining: " << root->dateOfJoining << endl;
    inorder(root->rchild);
}

void preorder(Node* root) {
    if(root == NULL) 
        return;

    cout << "ID: " << root->id << ", Name: " << root->name << ", Salary: " << root->salary 
         << ", Position: " << root->position << ", Date of Joining: " << root->dateOfJoining << endl;
    preorder(root->lchild);
    preorder(root->rchild);
}

void postorder(Node* root) {
    if(root == NULL)
        return;

    postorder(root->lchild);
    postorder(root->rchild);
    cout << "ID: " << root->id << ", Name: " << root->name << ", Salary: " << root->salary 
         << ", Position: " << root->position << ", Date of Joining: " << root->dateOfJoining << endl;
}

void searchBySalary(Node* root, int salary) {
    if (root == NULL) {
        cout << "Employee not found.\n";
        return;
    }

    if (root->salary == salary) {
        cout << "Employee found: ID: " << root->id << ", Name: " << root->name << ", Salary: " << root->salary 
             << ", Position: " << root->position << ", Date of Joining: " << root->dateOfJoining << endl;
        return;
    }

    if (salary < root->salary) {
        searchBySalary(root->lchild, salary);
    } else {
        searchBySalary(root->rchild, salary);
    }
}

bool searchByIdHelper(Node* root, int id) {
    if(root == NULL) {
        return false;
    }

    if(root->id == id) return true;
    
    return searchByIdHelper(root->lchild, id) || searchByIdHelper(root->rchild, id);
}

void searchById(Node* root, int id) {
    if(searchByIdHelper(root, id)) {
        cout << "Employee with ID " << id << " found in the system." << endl;
    } else {
        cout << "Employee with ID " << id << " not found in the system." << endl;
    }
}

void leastSalary(Node* root) {
    if(root == NULL) {
        cout << "Tree is empty." << endl;
        return;
    }           
    Node* temp = root;
    while(temp->lchild != NULL) {
        temp = temp->lchild;
    }
    cout << "Employee with least salary: ID: " << temp->id << ", Name: " << temp->name << ", Salary: " << temp->salary 
         << ", Position: " << temp->position << ", Date of Joining: " << temp->dateOfJoining << endl;
}

void highestSalary(Node* root) {
    if(root == NULL) {
        cout << "Tree is empty." << endl;
        return;
    }           
    Node* temp = root;
    while(temp->rchild != NULL) {
        temp = temp->rchild;
    }
    cout << "Employee with highest salary: ID: " << temp->id << ", Name: " << temp->name << ", Salary: " << temp->salary 
         << ", Position: " << temp->position << ", Date of Joining: " << temp->dateOfJoining << endl;
}


Node* deleteNode(Node* root, int salary) {
    if(root == NULL) return NULL; 

    if(salary < root->salary) {
        root->lchild = deleteNode(root->lchild, salary);
    } else if(salary > root->salary) {
        root->rchild = deleteNode(root->rchild, salary);
    } else {

        if(root->lchild == NULL && root->rchild == NULL) { // case 1: no child
            delete root;
            return NULL;
        }

        if(root->lchild == NULL) { // case 2: one child
            Node* temp = root->rchild;
            delete root;
            return temp;
        } else if(root->rchild == NULL) {
            Node* temp = root->lchild;
            delete root;
            return temp;
        }

        // case 3: two children
        Node* temp = root->rchild;
        while(temp && temp->lchild != NULL) {
            temp = temp->lchild;
        }

        root->salary = temp->salary;
        root->id = temp->id;
        root->name = temp->name;
        root->position = temp->position;
        root->dateOfJoining = temp->dateOfJoining;

        root->rchild = deleteNode(root->rchild, temp->salary);
    }

    return root;
}

int main() {

    Node* root1 = NULL;
    Node* prev1 = NULL;
    tree(root1);

    bool F = true;
    while(F == true) {
        cout << "\nChoose traversal method:\n";
        cout << "1. Inorder Traversal\n";
        cout << "2. Preorder Traversal\n";
        cout << "3. Postorder Traversal\n";
        cout << "4. Search Employee by Salary\n";
        cout << "5. Search Employee by ID\n";
        cout << "6. Delete Employee by Salary\n";
        cout << "7. Exit\n";
        cout << "Enter your choice: ";
        int choice;
        cin >> choice;

        switch(choice) {
            case 1:
                cout << "Inorder Traversal:\n";
                inorder(root1);
                break;
            case 2:
                cout << "Preorder Traversal:\n";
                preorder(root1);
                break;
            case 3:
                cout << "Postorder Traversal:\n";
                postorder(root1);
                break;
            case 4:
                int salary;
                cout << "Enter salary to search: ";
                cin >> salary;
                searchBySalary(root1, salary);
                break;
            case 5:
                int id;
                cout << "Enter ID to search: ";
                cin >> id;
                searchById(root1, id);
                break;
            case 6:
                cout << "Enter salary of employee to delete: ";
                cin >> salary;
                root1 = deleteNode(root1, salary);
                cout << "Employee with salary " << salary << " deleted if existed.\n";
                break;
            case 7:
                F = false;
                break;
            default:
                cout << "Invalid choice. Please try again.\n";
        }
    }
    
    return 0;
}