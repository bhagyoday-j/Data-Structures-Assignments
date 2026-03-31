//BFS
#include <iostream>
#include <vector>
#include <queue>
#include <stack>
using namespace std;

void bfs(vector<vector<int>>& graph, int start) {
    int v = graph.size();
    vector<bool> visited(v, false);
    queue<int> q;

    visited[start] = true;
    q.push(start);

    while(!q.empty()) {
        int u = q.front();
        q.pop();
        cout << u << " ";

        for(int j = 0; j < v; j++) {
            if(graph[u][j] != -1 && !visited[j]) {
                visited[j] = true;
                q.push(j);
            }
        }
    }
}

void dfs(vector<vector<int>>& graph, int start) {
    int v = graph.size();
    vector<bool> visited(v, false);
    stack<int> s;

    visited[start] = true;
    s.push(start);

    while(!s.empty()) {
        int u = s.top();
        s.pop();
        cout << u << " ";

        for(int j = 0; j < v; j++) {
            if(graph[u][j] != -1 && !visited[j]) {
                visited[j] = true;
                s.push(j);
            }
        }
    }
}

int main() {
    // Example usage
    vector<vector<int>> graph = {
        {0, 1, 1, -1},
        {1, 0, -1, 1},
        {1, -1, 0, 1},
        {-1, 1, 1, 0}
    };
    bfs(graph, 0);
    return 0;
}