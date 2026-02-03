//Graph

#include <iostream>
#include <vector>
#include <string>

using namespace std;

class Graph {
private:
    int V;                                  
    vector<vector<int>> fuel;               
    vector<string> cities;              

public:
    Graph(int vertices) {
        V = vertices;
        fuel.resize(V, vector<int>(V, 0));
        cities.resize(V);
    }

    void buildGraph() {
        cout << "Enter city names:\n";

        for (int i = 0; i < V; i++) {
            cout << "City " << i + 1 << ": ";
            cin >> cities[i];
        }

        cout << "\nEnter fuel required between flights:\n";
        for (int i = 0; i < V; i++) {
            for (int j = 0; j < V; j++) {
                if(i == j) continue;
                
                cout << "Fuel from " << cities[i] << " to " << cities[j] << ": ";
                cin >> fuel[i][j];
            }
        }
    }

    void printAdjacencyMatrix() {
        cout << "\nAdjacency Matrix (Fuel Required):\n";
        for (int i = 0; i < V; i++) {
            for (int j = 0; j < V; j++) {
                cout << fuel[i][j] << "\t";
            }
            cout << endl;
        }
    }

    void printAdjacencyList() {
        cout << "\nAdjacency List:\n";
        for (int i = 0; i < V; i++) {
            cout << cities[i] << " -> ";
            for (int j = 0; j < V; j++) {
                cout << fuel[i][j] << " ";
            }
            cout << endl;
        }
    }

    void printFlightDetails() {
        cout << "\nFlight Details:\n";
        for (int i = 0; i < V; i++) {
            for (int j = 0; j < V; j++) {
                cout << "Fuel required from "
                     << cities[i] << " to "
                     << cities[j] << " = "
                     << fuel[i][j] << endl;
            }
            cout << endl;
        }
    }
};

int main() {
    int v;
    cout << "Enter number of cities: ";
    cin >> v;

    Graph graph(v);

    graph.buildGraph();
    graph.printAdjacencyList();
    graph.printAdjacencyMatrix();
    graph.printFlightDetails();

    return 0;
}
