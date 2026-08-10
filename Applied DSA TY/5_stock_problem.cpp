#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int stock(vector<int>& arr) {

  if (arr.empty())
    return 0;
  
  int n = arr.size();
  int MaxStock = arr[n-1];
  int MaxProfit = 0;
  
  for(int i = n-2; i >= 0; i--) {
    MaxStock = max(MaxStock, arr[i]);
    MaxProfit += MaxStock - arr[i];
  }

  return MaxProfit;
}


int main() {
  
  int n;
  cout << "Enter size of array :";
  cin >> n;
  vector<int> arr(n);

  cout << "Enter array elements :";
  for(int i = 0; i < n; i++) {
    cin >> arr[i];
  }

  cout << "Max Profit is :";
  int ans = stock(arr);
  cout << ans << endl;

  return 0;
}