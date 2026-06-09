#include <iostream>
#include <vector>
#include <climits>
using namespace std;

void prims(vector<vector<int>>& graph) {
  int n = graph.size();

  vector<int> key(n, INT_MAX);
  vector<bool> vis(n, false);
  vector<int> par(n, -1);

  key[0] = 0;
  par[0] = -1;

  for(int i = 0; i < n-1; i++) {
    int minIdx = -1;
    int minVal = INT_MAX;

    for(int k = 0; k < n; k++) {
      if(!vis[k] && minVal > key[k]) {
        minIdx = k;
        minVal = key[k];
      }
    }

    int u = minIdx;
    vis[u] = true;

    for(int j = 0; j < n; j++) {
      if(!vis[j] && graph[u][j] != -1 && key[j] > graph[u][j]) {
        key[j] = graph[u][j];
        par[j] = u;
      }
    }
  }
}

int main() {

  return 0;
}