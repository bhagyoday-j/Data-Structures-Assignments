#include <iostream>
#include <list>
#include <vector>
#include <queue>
using namespace std;

class Edge {
public:
  int u;
  int v;
  int wt;

  Edge(int u, int v, int wt) {
    this->u = u;
    this->v = v;
    this->wt = wt;
  }
};

class Graph {
  int V;
  vector<list<pair<int, int>>> l; //(neighbor, weight)

public:
  Graph(int V) {
    this -> V = V;
    l.resize(V);
  }

  void addEdge(int u, int v, int wt) {
    l[u].push_back(make_pair(v, wt));
    l[v].push_back(make_pair(u, wt));
  }

  void primsAlgo(int src) {
    priority_queue<pair<int, pair<int,int>>, vector<pair<int, pair<int,int>>>, greater<pair<int, pair<int,int>>>> pq;//(weight, (parent, node))

    vector<bool> visited(V, false);
    vector<Edge> mst;

    pq.push({0, {-1, src}});
    int minCost = 0;

    while(!pq.empty()) {
        int wt = pq.top().first;
        int parent = pq.top().second.first;
        int u = pq.top().second.second;
        pq.pop();

        if(visited[u]) continue;

        visited[u] = true;
        minCost += wt;

        if(parent != -1) {
            mst.push_back(Edge(parent, u, wt));
        }

        for(auto n : l[u]) {
            int v = n.first;
            int currWt = n.second;

            if(!visited[v]) {
                pq.push({currWt, {u, v}});
            }
        }
    }

    cout << "Edges in MST:\n";
    for(auto e : mst) {
        cout << e.u << " - " << e.v << " : " << e.wt << endl;
    }

    cout << "Final cost of MST = " << minCost << endl;
  }
};

int main() {
  Graph ug(4);
  
  ug.addEdge(0, 1, 10);
  ug.addEdge(0, 2, 15);
  ug.addEdge(0, 3, 30);

  ug.addEdge(1, 3, 40);

  ug.addEdge(2, 3, 50);

  ug.primsAlgo(0);

  return 0;
}