#include <iostream>
#include <vector>
#include <climits>

using namespace std;

void obst(vector<int> p, vector<int> q, vector<int> keys) {
    int n = keys.size();

    vector<vector<int>> w(n+1, vector<int>(n+1, 0));//weight
    vector<vector<int>> c(n+1, vector<int>(n+1, 0));//cost
    vector<vector<int>> r(n+1, vector<int>(n+1, 0));//root

    for (int i = 0; i <= n; i++) {
        w[i][i] = q[i];
        c[i][i] = 0;
        r[i][i] = 0;
    }

    // length of subtree
    for (int len = 1; len <= n; len++) {
        for (int i = 0; i <= n - len; i++) {
            int j = i + len;

            // weight calculation
            w[i][j] = w[i][j - 1] + p[j - 1] + q[j];

            // find minimum cost
            c[i][j] = INT_MAX;

            for (int k = i + 1; k <= j; k++) {
                int cost = c[i][k - 1] + c[k][j];
                if (cost < c[i][j]) {
                    c[i][j] = cost;
                    r[i][j] = k;
                }
            }

            c[i][j] += w[i][j];
        }
    }

    // Display cost matrix
    cout << "\nCost Matrix:\n";
    for (int i = 0; i <= n; i++) {
        for (int j = 0; j <= n; j++) {
            cout << c[i][j] << "\t";
        }
        cout << endl;
    }

    // Display root matrix
    cout << "\nRoot Matrix:\n";
    for (int i = 0; i <= n; i++) {
        for (int j = 0; j <= n; j++) {
            cout << r[i][j] << "\t";
        }
        cout << endl;
    }
}

int main() {
  /*
    int n;

    cout << "Enter size of keys : ";
    cin >> n;

    vector<int> keys;
    vector<int> p;     // success probabilities
    vector<int> q;  // failure probabilities

    cout << "Enter keys (n) : ";
    for (int i = 0; i < n; i++) {
        int key;
        cin >> key;
        keys.push_back(key);
    }

    cout << "Enter success probabilities (n) : ";
    for (int i = 0; i < n; i++) {
        int prob;
        cin >> prob;
        p.push_back(prob);
    }

    cout << "Enter failure probabilities (n+1) : ";
    for (int i = 0; i <= n; i++) {
        int prob;
        cin >> prob;
        q.push_back(prob);
    }
        
  */

     // Example:
    vector<int> keys = {10, 20, 30};
    vector<int> p = {3, 3, 1};     // success probabilities
    vector<int> q = {2, 3, 1, 1};  // failure probabilities

    obst(p, q, keys);

    return 0;
}