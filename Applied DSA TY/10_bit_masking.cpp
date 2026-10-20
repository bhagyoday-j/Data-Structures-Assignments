/*
Implement program to find all distinct subsets of a given set using Bit Masking Approach.  

Statement: - Given an array of integers arr[], 
The task is to find all its subsets. The subset cannot contain duplicate elements, 
so any repeated subset should be considered only once in the output. 
*/
#include<iostream>
#include<vector>
#include<set>
#include<cmath>
using namespace std;

int main(){
    int n;
    cout<<"Enter no of Elements : ";
    cin>>n;
    vector<int>arr(n);
    cout<<"Enter "<<n<<" Elements : ";
    
    for(int i=0; i<n; i++)
        cin>>arr[i];
    
    set<vector<int>> s;
    // Generate all masks
    for(int mask = 0; mask < pow(2,n); mask++){
        vector<int>subset;

        for(int i = 0; i < n; i++){
            // Check if i-th bit is 1
            if ((mask/(int)pow(2,i))%2==1){
                subset.push_back(arr[i]);
            }
        }
        s.insert(subset);
    }

    // Print all distinct subsets
    for (auto subset:s){
        cout << "{ ";
        for (int x : subset){
            cout << x << " ";
        }
        cout << "}" << endl;
    }
    return 0;
}
/*
#include <iostream>
#include <vector>
#include <set>
#include <algorithm>

using namespace std;

int main() {
    int n;

    cout << "Enter number of elements: ";
    cin >> n;

    vector<int> arr(n);

    cout << "Enter elements: ";
    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }

    // Sort to handle duplicates properly
    sort(arr.begin(), arr.end());

    set<vector<int>> uniqueSubsets;

    int totalSubsets = 1 << n;   // 2^n

    for (int mask = 0; mask < totalSubsets; mask++) {
        vector<int> subset;

        for (int i = 0; i < n; i++) {
            if (mask & (1 << i)) {
                subset.push_back(arr[i]);
            }
        }

        uniqueSubsets.insert(subset);
    }

    cout << "\nDistinct Subsets:\n";

    for (auto subset : uniqueSubsets) {
        cout << "{ ";
        for (int x : subset) {
            cout << x << " ";
        }
        cout << "}\n";
    }

    return 0;
}
*/