#include <iostream>
#include <vector>
using namespace std;

void subsetSum(vector<int>& arr, int sum) {
    int n = arr.size();

    // dp[i][j] = true if we can make sum j
    // using first i elements
    vector<vector<bool>> dp(n + 1, vector<bool>(sum + 1, false));

    // Sum 0 is always possible using an empty subset
    for (int i = 0; i <= n; i++) {
        dp[i][0] = true;
    }

    // Build DP table
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= sum; j++) {

            // Do not include arr[i-1]
            dp[i][j] = dp[i - 1][j];

            // Include arr[i-1] if possible
            if (arr[i - 1] <= j) {
                dp[i][j] =
                    dp[i][j] || dp[i - 1][j - arr[i - 1]];
            }
        }
    }

    // Check if subset exists
    if (!dp[n][sum]) {
        cout << "No subset found." << endl;
        return;
    }

    cout << "Subset found: ";

    // Backtracking to find the subset
    int i = n;
    int j = sum;

    vector<int> subset;

    while (i > 0 && j > 0) {

        // If current element was included
        if (dp[i][j] && dp[i - 1][j] == false) {
            subset.push_back(arr[i - 1]);
            j = j - arr[i - 1];
        }

        i--;
    }

    // Display subset
    for (int k = subset.size() - 1; k >= 0; k--) {
        cout << subset[k] << " ";
    }

    cout << endl;
}

int main() {
    vector<int> arr = {3, 34, 4, 12, 5, 2};
    int sum = 9;

    subsetSum(arr, sum);

    return 0;
}