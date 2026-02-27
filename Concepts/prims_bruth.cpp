# include <iostream>
# include<climits>
# include <vector>
using namespace std;

int findMinIndex(vector<bool> &visited, vector<int> &key){
    int v = visited.size();
    int minIdx = -1;
    int min = INT_MAX;
    for(int i=0; i<v; i++){
        if(!visited[i] && key[i]<min){
            minIdx = i;
            min = key[i];
        }
    }

    return minIdx;
}

void MST(int v, vector<vector<int>>& graph){
    vector<int> parent(v, -1);
    vector<bool> visited(v, false);
    vector<int> key(v, INT_MAX);
    key[0] = 0;

    parent[0] = -1;

    for(int i = 0; i < v-1; i++){

        int u = findMinIndex( visited, key);
        if (u == -1) break;
        visited[u] = true;

        for(int j = 0; j < v; j++){
            if(!visited[j] && graph[u][j] != 0 && graph[u][j] < key[j]){
                key[j] = graph[u][j];
                parent[j] = u;
            }
        }
    }

    cout<<"Total cost : ";
    int sum = 0;

    for(int i = 0; i < v; i++){
        sum += key[i];
    }

    cout<<sum<<endl;

    cout<<"Pairs"<<endl;
    for(int i=1; i<v; i++){
        cout<<parent[i]<<" - "<< i << " => "<< key[i]<<endl;
    }

}

void creategraph(vector<vector<int>>& graph) {
    int v = graph.size();

    for (int i = 0; i < v; i++) {
        for (int j = i + 1; j < v; j++) {
            cout << "Edge weight between " << i << " and " << j << ": ";
            cin >> graph[i][j];
            graph[j][i] = graph[i][j];  
        }
    }
}

int main(){

    int v, choice;

    cout << "Enter number of vertices: ";
    cin >> v;

    vector<vector<int>> graph(v, vector<int>(v, 0));

    creategraph(graph);
    MST(v, graph);


    return 0;
}