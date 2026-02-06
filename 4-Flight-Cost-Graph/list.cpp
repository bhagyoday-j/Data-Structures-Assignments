//Graph

#include <iostream>
#include <vector>
#include <string>
using namespace std;

class Node {
public:
    int fuel;
    string city;
    Node* next;

    Node(int fuel, string city) {
      this->fuel = fuel;
      this->city = city;
      next = NULL;
    }
};

class LinkedList {
public:
    Node* head;

public:
    LinkedList() {
      head = NULL;
    }

    void addRoute(string city, int fuel) {
        Node* newNode = new Node(fuel, city);
        newNode->next = head;
        head = newNode;
    }

    void display() {
        if (head == NULL) {
            cout << "No routes available.";
            return;
        }

        Node* temp = head;
        while (temp) {
            cout << "(" << temp->city << ", Fuel: " << temp->fuel << ")  ";
            temp = temp->next;
        }
    }
};

int main() {
    int cityCount;
    cout << "Enter number of cities: ";
    cin >> cityCount;

    vector<string> cityNames(cityCount);
    vector<LinkedList> routes(cityCount);

    cout << "\nEnter city names:\n";
    for (int i = 0; i < cityCount; i++) {
        cout << "City " << i + 1 << ": ";
        cin >> cityNames[i];
    }

    for (int i = 0; i < cityCount; i++) {
        cout << "\nRoutes from " << cityNames[i] << ":\n";

        char ch;
        do {
            string destination;
            int fuel;

            cout << "Destination city: ";
            cin >> destination;

            cout << "Fuel required: ";
            cin >> fuel;

            routes[i].addRoute(destination, fuel);

            cout << "Add another route? (y/n): ";
            cin >> ch;

        } while (ch == 'y' || ch == 'Y');
    }

    cout << "\nCity Routes:\n";
    for (int i = 0; i < cityCount; i++) {
        cout << cityNames[i] << " -> ";
        routes[i].display();
        cout << endl;
    }

    return 0;
}
