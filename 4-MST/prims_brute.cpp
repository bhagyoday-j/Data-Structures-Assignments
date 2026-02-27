/*
Prim’s Algorithm (MST)

Step 1: Maintain three arrays/lists
        Parent[] => Stores the parent of each vertex in the spanning tree.
        Key[] (Minimum Cost List) => Stores the minimum weight required to connect each vertex to the MST.
        visited[] (Included List) => Keeps track of vertices already included in the MST.

Step 2: Initialization
        Select any vertex as the starting vertex.
        Set its key value to 0.
        Set key values of all other vertices to infinity.
        Mark all vertices as not included in MST.

Step 3: Repeat (V - 1) times
        1.Select Vertex
            Choose the vertex with the minimum key value that is not yet included in MST.
        2.Include Vertex
            Mark this selected vertex as included in MST.
        3.Update Adjacent Vertices
            -For each adjacent vertex:
                -If the vertex is not included in MST, and
                -The weight of the edge is less than its current key value, then:
                    -Update its key value.
                    -Set its parent as the selected vertex.

Step 4: Output
        The Parent[] array represents the Minimum Spanning Tree.
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
    key      : 0 i i i
    parent   : ? ? ? ?
    visited  : f f f f
    (Start from A) so key[A] = 0

Step 2: Iteration 1
    Select vertex with minimum key -> A (0)
    Include A in MST i.e. visited[A] = t

    Update adjacent vertices (non visited vertices):
        B -> key = 2, parent = A
        C -> key = 3, parent = A

    vertex   : A B C D
    key      : 0 2 3 i
    parent   : ? A A ?
    visited  : t f f f

Step 3: Iteration 2
    Select B (2) (smallest key)
    Include B in MST
    Update adjacent vertices:
        C -> min(3, 1) -> 1, parent = B
        D -> key = 4, parent = B

    vertex   : A B C D
    key      : 0 2 1 4
    parent   : ? A B B
    visited  : t t f f

Step 4: Iteration 3
    Select C (1)
    Include C in MST
    Update adjacent vertices:
        D -> min(4, 5) -> no change

    vertex   : A B C D
    key      : 0 2 1 4
    parent   : ? A B B
    visited  : t t t f

Step 5: Iteration 4
    Select D (4)
    Include D in MST
    
Step 6: Final MST (Using Parent Array)
    Edges in MST:
        A — B (2)
        B — C (1)
        B — D (4)
    
    Total Cost = 2 + 1 + 4 = 7
*/

# include <iostream>
# include<climits>
# include <vector>
using namespace std;

void MST(int v, vector<vector<int>>& graph){
    vector<int> parent(v, -1);
    vector<bool> visited(v, false);
    vector<int> key(v, INT_MAX);
    key[0] = 0;

    parent[0] = -1;

    for(int i = 0; i < v-1; i++){
        //find min index
        int minIdx = -1;
        int minVal = INT_MAX;

        for(int k = 0; k < v; k++){
            if(!visited[k] && key[k] < minVal){
                minIdx =k;
                minVal = key[k];
            }
        }

        int u = minIdx;
        if (u == -1) break;
        visited[u] = true;

        for(int j = 0; j < v; j++){
            if(!visited[j] && graph[u][j] != -1 && graph[u][j] < key[j]){
                key[j] = graph[u][j];
                parent[j] = u;
            }
        }
    }

    int sum = 0;
    for(int i = 0; i < v; i++){
        sum += key[i];
    }

    cout<<"Total cost : ";
    cout<<sum<<endl;

    cout<<"MST : "<<endl;
    for(int i=1; i<v; i++){
        cout<<parent[i]<<" - "<< i << " => ("<< key[i] << ")"<<endl;
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
    MST(v, graph);

    return 0;
}