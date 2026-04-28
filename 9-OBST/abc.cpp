#include <iostream>
#include <vector>
#include <cfloat>
using namespace std;

class OBST {
    int n;
    vector<string> keys;
    vector<float> p;
    vector<float> q;
    vector<vector<float>> w;
    vector<vector<float>> c;
    vector<vector<int>> r;

public:
    void buildOBST();
    void preorder(int i, int j);
    void showResult();
};

void OBST::buildOBST() {
    cout << "\nEnter number of products: ";
    cin >> n;
    keys.resize(n + 1);
    p.resize(n + 1);
    q.resize(n + 1);
    w.resize(n + 1, vector<float>(n + 1, 0));
    c.resize(n + 1, vector<float>(n + 1, 0));
    r.resize(n + 1, vector<int>(n + 1, 0));

    cout << "Enter products:\n";
    for (int i = 1; i <= n; i++) {
        cin >> keys[i];
    }

    cout << "Enter successful search probabilities (p[i]):\n";
    for (int i = 1; i <= n; i++) {
        cin >> p[i];
    }

    cout << "Enter failure probabilities (q[i]):\n";
    for (int i = 0; i <= n; i++) {
        cin >> q[i];
    }

    for (int i = 0; i <= n; i++) {
        w[i][i] = q[i];
        c[i][i] = 0;
        r[i][i] = 0;
    }

    for (int i = 0; i <= n; i++) {
        for (int j = i + 1; j <= n; j++) {
            w[i][j] = w[i][j - 1] + p[j] + q[j];
        }
    }

    for (int len = 1; len <= n; len++) {
        for (int i = 0; i <= n - len; i++) {
            int j = i + len;

            c[i][j] = FLT_MAX;

            for (int k = i + 1; k <= j; k++) {
                float cost = c[i][k - 1] + c[k][j] + w[i][j];

                if (cost < c[i][j]) {
                    c[i][j] = cost;
                    r[i][j] = k;
                }
            }
        }
    }
}

void OBST::preorder(int i, int j) {
    if (i >= j) return;

    int root = r[i][j];
    cout << keys[root] << " ";

    preorder(i, root - 1);
    preorder(root, j);
}

void OBST::showResult() {
    cout << "\n\n\nOBST of products \n";

    cout << "Preorder Traversal: ";
    preorder(0, n);

    cout << "\n-------------------------------\n";
    cout << "Root of Tree: " << keys[r[0][n]] << "\n";
}

int main() {
    OBST obj;

    obj.buildOBST();
    obj.showResult();

    cout << "\n\n";

    return 0;
}