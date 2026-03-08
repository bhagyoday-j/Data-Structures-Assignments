/*
Dijkstra’s Algorithm (Single Source Shortest Path)

Step 1: Maintain three arrays/lists
        Parent[] => Stores the parent of each vertex in the shortest path tree.
        Dist[] (Distance List) => Stores the shortest distance from source to each vertex.
        visited[] => Keeps track of vertices whose shortest distance is finalized.

Step 2: Initialization
        Select source vertex.
        Set its distance value to 0.
        Set distance of all other vertices to infinity.
        Mark all vertices as not visited.

Step 3: Repeat (V - 1) times
        1.Select Vertex
            Choose the vertex with minimum distance that is not visited.

        2.Mark Visited
            Mark this vertex as visited.

        3.Update Adjacent Vertices
            -For each adjacent vertex:
                -If it is not visited, and
                -Distance through current vertex is smaller than current stored distance:
                    -Update distance
                    -Update parent

Step 4: Output
        The Dist[] array gives shortest distances from source.
        The Parent[] array gives shortest path tree.
*/

/*
Vertices: A, B, C, D
Edges with weights:
    A–B = 2
    A–C = 3
    B–C = 1
    B–D = 4
    C–D = 5

Step 1: Initialization
    vertex   : A B C D
    dist     : 0 i i i
    parent   : ? ? ? ?
    visited  : f f f f
    (Start from A)

Step 2: Iteration 1
    Select A (0)
    visited[A] = t

    Update:
        B -> 2, parent = A
        C -> 3, parent = A

    vertex   : A B C D
    dist     : 0 2 3 i
    parent   : ? A A ?
    visited  : t f f f

Step 3: Iteration 2
    Select B (2)
    visited[B] = t

    Update:
        C -> min(3, 2+1=3) -> no change
        D -> 2+4 = 6, parent = B

    vertex   : A B C D
    dist     : 0 2 3 6
    parent   : ? A A B
    visited  : t t f f

Step 4: Iteration 3
    Select C (3)
    visited[C] = t

    Update:
        D -> min(6, 3+5=8) -> no change

    vertex   : A B C D
    dist     : 0 2 3 6
    parent   : ? A A B
    visited  : t t t f

Step 5: Iteration 4
    Select D (6)
    visited[D] = t

Step 6: Final Output
    Shortest Distance from A:
        A -> 0
        B -> 2
        C -> 3
        D -> 6

    Paths:
        A — B
        A — C
        A — B — D
*/

#include <iostream>
#include <climits>
#include <vector>
using namespace std;

void dijkstra(int v, vector<vector<int>>& graph){
    vector<int> parent(v, -1);
    vector<bool> visited(v, false);
    vector<int> dist(v, INT_MAX);

    dist[0] = 0; // source vertex

    for(int i = 0; i < v-1; i++){
        // find minimum distance vertex
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
        cout << "0 to " << i << " Cost is : " << dist[i] << " => "; 
        while(j != 0) {
            cout << j << "-";
            j = parent[j];
        }
        cout << 0 << endl;
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
    int v;

    cout << "Enter number of vertices: ";
    cin >> v;

    vector<vector<int>> graph(v, vector<int>(v, -1));

    creategraph(graph);
    dijkstra(v, graph);

    return 0;
}