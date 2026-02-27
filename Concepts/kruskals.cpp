#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

class Edge {
public:
    int u, v, wt;

    Edge(int u, int v, int wt) {
        this->u = u;
        this->v = v;
        this->wt = wt;
    }
};

// Comparator for sorting edges
bool cmp(Edge a, Edge b) {
    return a.wt < b.wt;
}

class Graph {
    int V;
    vector<Edge> edges;

    // DSU (Disjoint Set)
    vector<int> parent, rank;

public:
    Graph(int V) {
        this->V = V;
        parent.resize(V);
        rank.resize(V, 0);

        for(int i = 0; i < V; i++) {
            parent[i] = i;
        }
    }

    void addEdge(int u, int v, int wt) {
        edges.push_back(Edge(u, v, wt));
    }

    // Find with Path Compression
    int find(int x) {
        if(parent[x] != x) {
            parent[x] = find(parent[x]);
        }
        return parent[x];
    }

    // Union by Rank
    void unionSet(int a, int b) {
        int pa = find(a);
        int pb = find(b);

        if(pa != pb) {
            if(rank[pa] < rank[pb]) {
                parent[pa] = pb;
            } else if(rank[pb] < rank[pa]) {
                parent[pb] = pa;
            } else {
                parent[pb] = pa;
                rank[pa]++;
            }
        }
    }

    void kruskalAlgo() {
        sort(edges.begin(), edges.end(), cmp);

        vector<Edge> mst;
        int minCost = 0;

        for(auto e : edges) {
            int u = e.u;
            int v = e.v;
            int wt = e.wt;

            // Check cycle
            if(find(u) != find(v)) {
                mst.push_back(e);
                minCost += wt;
                unionSet(u, v);
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
    Graph g(4);

    g.addEdge(0, 1, 10);
    g.addEdge(0, 2, 15);
    g.addEdge(0, 3, 30);
    g.addEdge(1, 3, 40);
    g.addEdge(2, 3, 50);

    g.kruskalAlgo();

    return 0;
}