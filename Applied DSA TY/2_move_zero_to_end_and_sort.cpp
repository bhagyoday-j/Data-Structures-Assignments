#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

void merge(vector<int>& arr, int st, int mid, int end) {
  vector<int> temp;
  int i = st;
  int j = mid + 1;

  while(i <= mid && j <= end) {
    if(arr[i] <= arr[j]) {
      temp.push_back(arr[i++]);
    } else {
      temp.push_back(arr[j++]);
    }
  }

  while(i <= mid) 
    temp.push_back(arr[i++]);

  while(j <= end) 
    temp.push_back(arr[j++]);


  //Copying merged elements in temp to original arr
  int l = 0;
  for(int k = st; k <= end; k++) 
    arr[k] = temp[l++];
}

void mergeSort(vector<int>& arr, int st, int end) {

  if(st >= end) {
    return;
  }

  int mid = st + (end - st) / 2;

  mergeSort(arr, st, mid); // left half
  mergeSort(arr, mid+1, end); // end half

  merge(arr, st, mid, end); // conquer
}


int main() {
    int n;
    cout << "Enter size of vector: ";
    cin >> n;

    vector<int> nums(n);

    cout << "Enter elements: ";
    for(int i = 0; i < n; i++) {
        cin >> nums[i];
    }

    vector<int> nonZero;
    int zeroCount = 0;

    // Separate non-zero elements and count zeros
    for(int x : nums) {
        if (x == 0)
            zeroCount++;
        else
            nonZero.push_back(x);
    }

    // Sort non-zero elements
    //sort(nonZero.begin(), nonZero.end());
    mergeSort(nonZero, 0, nonZero.size()-1);

    // Add zeros at the end
    while (zeroCount--) {
        nonZero.push_back(0);
    }

    cout << "Result: ";
    for (int x : nonZero) {
        cout << x << " ";
    }

    return 0;
}