#include <iostream>
#include <climits>
#include <vector>
using namespace std;

void dijkstra(int v, vector<vector<int>>& graph){
    //create graph
    vector<string> weddingHalls(v);

    for(int i = 0; i < v; i++) {
        cout << "Enter name of wedding hall " << i << ": ";
        cin >> weddingHalls[i];
    }

    for (int i = 0; i < v; i++) {
        for (int j = i + 1; j < v; j++) {
            cout << "Edge weight between " << weddingHalls[i] << " and " << weddingHalls[j] << ": ";
            cin >> graph[i][j];
            graph[j][i] = graph[i][j];  
        }
    }

    // Dijkstra's algorithm
    vector<int> parent(v, -1);
    vector<bool> visited(v, false);
    vector<int> dist(v, INT_MAX);

    int source;
    cout << "Wedding Halls:\n";
    for(int i = 0; i < v; i++) {
        cout << i << ": " << weddingHalls[i] << endl;
    }
    cout << "Enter initial hall location (0 to " << v-1 << "): ";
    cin >> source;

    dist[source] = 0; 

    for(int i = 0; i < v-1; i++){
        int minIdx = -1;
        int minVal = INT_MAX;

        for(int k = 0; k < v; k++){
            if(!visited[k] && dist[k] < minVal){
                minVal = dist[k];
                minIdx = k;
            }
        }

        int u = minIdx;
        if(u == -1) break;

        visited[u] = true;

        for(int j = 0; j < v; j++){
            if(!visited[j] && graph[u][j] != -1 && dist[u] + graph[u][j] < dist[j]){
                dist[j] = dist[u] + graph[u][j];
                parent[j] = u;
            }
        }
    }

    cout<<"\nPaths:\n";
    for(int i = 1; i < v; i++) {
        int j = i;
        cout << weddingHalls[source] << " to " << weddingHalls[i] << " Cost is : " << dist[i] << " => "; 
        while(j != source) {
            cout << weddingHalls[j] << "-";
            j = parent[j];
        }
        cout << weddingHalls[source] << endl;
    }
}

int main(){
    int v;

    cout << "Enter number of wedding halls: ";
    cin >> v;

    vector<vector<int>> graph(v, vector<int>(v, -1));

    dijkstra(v, graph);

    return 0;
}