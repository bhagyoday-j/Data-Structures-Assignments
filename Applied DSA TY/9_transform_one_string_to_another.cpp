#include <iostream>
#include <string>
#include <vector>
#include <cctype>
using namespace std;

bool transform(string s1, string s2) {
    int n = s1.length();
    int m = s2.length();

    vector<vector<bool>> dp(n + 1, vector<bool>(m + 1, false));

    dp[0][0] = true;

    // If s2 is empty, we can only delete lowercase letters from s1
    for (int i = 1; i <= n; i++) {
        if (islower(s1[i - 1]))
            dp[i][0] = dp[i - 1][0];
        else
            dp[i][0] = false;
    }

    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {

            if (islower(s1[i - 1])) {

                // Option 1: Delete lowercase character
                dp[i][j] = dp[i - 1][j];

                // Option 2: Capitalize and match
                if (toupper(s1[i - 1]) == s2[j - 1]) {
                    dp[i][j] = dp[i][j] || dp[i - 1][j - 1];
                }

            } else { // Uppercase character

                if (s1[i - 1] == s2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                }
            }
        }
    }

    return dp[n][m];
}

int main() {
    string s1;
    string s2;

    cout << "Enter string s1 : ";
    cin >> s1;
    //getline(cin, s1);

    cout << "Enter string s2 (all letters in uppercase) : ";
    cin >> s2;

    if (transform(s1, s2)) {
        cout << "Yes Possible to transform s1 to s2" << endl;
    } else {
        cout << "Not Possible to transform s1 to s2" << endl;
    }

    return 0;
}