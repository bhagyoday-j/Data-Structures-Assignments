#include <iostream>
#include <vector>
using namespace std;

class Graph {
    int V; 
    vector<vector<int>> adj; 

public:
    Graph(int V) {
        this->V = V;
        adj.resize(V);
    }

    void buildGraph() {
      for(int i = 0; i < V; i++) {
          cout << "Enter all adjacent vertices of " << i + 1 << endl;
          char ch = 'y';

          do {
              int x;
              cout << "Enter adjacent vertex: ";
              cin >> x;

              adj[i].push_back(x);

              cout << "Is one more vertex (y/n): ";
              cin >> ch;
          } while(ch == 'y');
      }
    }

    void printGraph() {
      cout << "\nAdjacency List:\n";
      for(int i = 0; i < V; i++) {
          cout << i + 1 << " : ";
          for(int j = 0; j < adj[i].size(); j++) {
              cout << adj[i][j] << " ";
          }
          cout << endl;
      }
    }
};

int main() {
  Graph g1(3);  

  g1.buildGraph();
  g1.printGraph();
  
  return 0;
}

