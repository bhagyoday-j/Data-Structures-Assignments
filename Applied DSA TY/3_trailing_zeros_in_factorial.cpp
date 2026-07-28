#include <iostream>
using namespace std;

int countTrailingZerosInFactorial(int num) {
  int zeroCount = 0;
  int i = 5;

  while((num / i) > 0) {
    zeroCount += num / i;
    i *= 5;
  }

  return zeroCount;
}

int findSmallestNumberWithNTrailingZeros(int n) {
  int st = 0;
  int end = n*5;
  int ans = -1;

  while(st <= end) {
    int mid = st + (end - st) / 2;

    int trailingZeros = countTrailingZerosInFactorial(mid);

    if(trailingZeros > n) {
      end = mid - 1;
    } else if(trailingZeros < n) {
      st = mid + 1;
    } else {
      ans = mid;
      end = mid - 1;
    }
  }

  return ans;
}

int main() {

  int n;
  cout << "Enter n : ";
  cin >> n;

  int m = findSmallestNumberWithNTrailingZeros(n);

  cout << m;

  return 0;
}