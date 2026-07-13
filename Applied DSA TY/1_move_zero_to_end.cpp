#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cout << "Enter size of array: ";
    cin >> n;

    vector<int> arr(n);

    cout << "Enter 0s and 1s: ";
    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }

    int zeroCount = 0;

    // Count zeros
    for (int x : arr) {
        if (x == 0)
            zeroCount++;
    }

    int oneCount = n - zeroCount;

    // Put all 1s first
    for (int i = 0; i < oneCount; i++) {
        arr[i] = 1;
    }

    // Put all 0s at the end
    for (int i = oneCount; i < n; i++) {
        arr[i] = 0;
    }

    cout << "Number of zeros: " << zeroCount << endl;

    cout << "Modified array: ";
    for (int x : arr) {
        cout << x << " ";
    }

    return 0;
}