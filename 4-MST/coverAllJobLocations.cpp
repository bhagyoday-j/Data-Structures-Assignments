#include <iostream>
#include <climits>
#include <vector>
using namespace std;

class Edge {
public:
    int distance;
    int time;
    string location1;
    string location2;

    Edge() {
        distance = INT_MAX;
        time = INT_MAX;
        location1 = "";
        location2 = "";
    }

    Edge(int d, string loc1, string loc2) {
        distance = d;
        time = d;
        location1 = loc1;
        location2 = loc2;
    }
};

void MST(int v, vector<vector<Edge>>& graph){
    vector<int> parent(v, -1);
    vector<bool> visited(v, false);
    vector<int> key(v, INT_MAX);

    key[0] = 0;

    for(int i = 0; i < v-1; i++){
        int minIdx = -1;
        int minVal = INT_MAX;

        for(int k = 0; k < v; k++){
            if(!visited[k] && key[k] < minVal){
                minIdx = k;
                minVal = key[k];
            }
        }

        int u = minIdx;
        if (u == -1) break;

        visited[u] = true;

        for(int j = 0; j < v; j++){
            if(!visited[j] && graph[u][j].distance != INT_MAX && graph[u][j].distance < key[j]){
                key[j] = graph[u][j].distance;
                parent[j] = u;
            }
        }
    }

    int sum = 0;
    for(int i = 0; i < v; i++){
        sum += key[i];
    }

    cout<<"Total distance : "<<sum<<endl;

    cout<<"Path to cover all job locations(MST) : "<<endl;
    for(int i=1; i<v; i++){
        cout<<parent[i]<<" - "<< i << " => ("<< key[i] << ")"<<endl;
    }
}

void creategraph(vector<vector<Edge>>& graph) {
    int v = graph.size();
    vector<string> locations(v);

    cout << "Enter Locations of the jobs: " << endl;
    for(int i = 0; i < v; i++) {
        cout << "Location " << i + 1 << ": ";
        cin >> locations[i];
    }

    for (int i = 0; i < v; i++) {
        for (int j = i + 1; j < v; j++) {

            string loc1 = locations[i];
            string loc2 = locations[j];

            cout << "Enter distance between " << loc1 << " and " << loc2 << ":(if not connected, enter " << INT_MAX << ") ";
            int distance;
            cin >> distance;

            graph[i][j] = Edge(distance, loc1, loc2);
            graph[j][i] = Edge(distance, loc2, loc1); 
        }
    }
}

int main(){

    int v;

    cout << "Enter number of Job locations: ";
    cin >> v;

    vector<vector<Edge>> graph(v, vector<Edge>(v));

    creategraph(graph);

    MST(v, graph);

    return 0;
}