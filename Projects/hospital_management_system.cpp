#include <iostream>
using namespace std;

struct Patient {
    int id;
    string name;
    int age;
    string disease;
    int severity;

    Patient* left;
    Patient* right;

    Patient(int i, string n, int a, string d, int s) {
        id = i;
        name = n;
        age = a;
        disease = d;
        severity = s;
        left = right = NULL;
    }
};

class HospitalBST {
private:
    Patient* root;

    // Insert Node
    Patient* insert(Patient* node, Patient* newNode) {
        if (node == NULL)
            return newNode;

        if (newNode->severity < node->severity)
            node->left = insert(node->left, newNode);
        else
            node->right = insert(node->right, newNode);

        return node;
    }

    void inorder(Patient* node) {
        if (node != NULL) {
            inorder(node->left);
            display(node);
            inorder(node->right);
        }
    }

    void display(Patient* p) {
        cout << "\nID       : " << p->id
             << "\nName     : " << p->name
             << "\nAge      : " << p->age
             << "\nDisease  : " << p->disease
             << "\nSeverity : " << p->severity << endl;
    }

    Patient* searchByID(Patient* node, int id) {
        if (node == NULL)
            return NULL;

        if (node->id == id)
            return node;

        Patient* leftResult = searchByID(node->left, id);
        if (leftResult != NULL)
            return leftResult;

        return searchByID(node->right, id);
    }

    Patient* searchBySeverity(Patient* node, int severity) {
        if (node == NULL || node->severity == severity)
            return node;

        if (severity < node->severity)
            return searchBySeverity(node->left, severity);
        else
            return searchBySeverity(node->right, severity);
    }

    void displayCritical(Patient* node) {
        if (node != NULL) {
            displayCritical(node->left);
            if (node->severity >= 7)
                display(node);
            displayCritical(node->right);
        }
    }

    void displayNonCritical(Patient* node) {
        if (node != NULL) {
            displayNonCritical(node->left);
            if (node->severity < 7)
                display(node);
            displayNonCritical(node->right);
        }
    }

    // Find Max (Most Critical)
    Patient* findMax(Patient* node) {
        while (node && node->right != NULL)
            node = node->right;
        return node;
    }

    // Find Min (Least Critical)
    Patient* findMin(Patient* node) {
        while (node && node->left != NULL)
            node = node->left;
        return node;
    }

public:
    HospitalBST() {
        root = NULL;
    }

    // Add Patient
    void addPatient() {
        int id, age, severity;
        string name, disease;

        cout << "\nEnter ID   : ";
        cin >> id;
        cout << "Enter Name   : ";
        cin >> name;
        cout << "Enter Age    : ";
        cin >> age;
        cout << "Enter Disease: ";
        cin >> disease;
        cout << "Enter Severity (0-10): ";
        cin >> severity;

        Patient* newPatient = new Patient(id, name, age, disease, severity);
        root = insert(root, newPatient);

        cout << "\nPatient Added Successfully!\n";
    }

    // Search Patient
    void searchPatient() {
        int choice;
        cout << "\n1. Search by ID\n2. Search by Severity\nEnter choice: ";
        cin >> choice;

        if (choice == 1) {
            int id;
            cout << "Enter ID: ";
            cin >> id;

            Patient* result = searchByID(root, id);
            if (result)
                display(result);
            else
                cout << "Patient not found!\n";
        } else {
            int severity;
            cout << "Enter Severity: ";
            cin >> severity;

            Patient* result = searchBySeverity(root, severity);
            if (result)
                display(result);
            else
                cout << "Patient not found!\n";
        }
    }

    void showCritical() {
        cout << "\n--- Critical Patients ---\n";
        displayCritical(root);
    }

    void showNonCritical() {
        cout << "\n--- Non-Critical Patients ---\n";
        displayNonCritical(root);
    }

    void showMostCritical() {
        Patient* p = findMax(root);
        if (p) {
            cout << "\n--- Most Critical Patient ---\n";
            display(p);
        } else {
            cout << "No patients available!\n";
        }
    }

    // Least Critical
    void showLeastCritical() {
        Patient* p = findMin(root);
        if (p) {
            cout << "\n--- Least Critical Patient ---\n";
            display(p);
        } else {
            cout << "No patients available!\n";
        }
    }

    void displayAll() {
        cout << "\n--- All Patients ---\n";
        inorder(root);
    }
};

int main() {
    HospitalBST h;
    int choice;

    do {
        cout << "\n===== Hospital Management System =====\n";
        cout << "1. Add Patient\n";
        cout << "2. Search Patient\n";
        cout << "3. Display Critical Patients\n";
        cout << "4. Display Non-Critical Patients\n";
        cout << "5. Show Most Critical Patient\n";
        cout << "6. Show Least Critical Patient\n";
        cout << "7. Display All Patients\n";
        cout << "0. Exit\n";
        cout << "Enter choice: ";
        cin >> choice;

        switch (choice) {
            case 1: h.addPatient(); break;
            case 2: h.searchPatient(); break;
            case 3: h.showCritical(); break;
            case 4: h.showNonCritical(); break;
            case 5: h.showMostCritical(); break;
            case 6: h.showLeastCritical(); break;
            case 7: h.displayAll(); break;
            case 0: cout << "Exiting...\n"; break;
            default: cout << "Invalid choice!\n";
        }

    } while (choice != 0);

    return 0;
}