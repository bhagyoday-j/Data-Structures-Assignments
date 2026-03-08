#include <iostream>
#include <vector>
using namespace std;

int hashFun(int key, int n) {
  return key % n;
}

int main() {

  int n = n;

  vector<vector<int>> hashTable(n, vector<int>(2, -1)); // element, chain length
  vector<int> keys(n);

  cout << "Enter keys : " << endl;
  for(int i = 0; i < n; i++) {
    cin >> keys[i];
  }

  for(int i = 0; i < n; i++) {
    int hashVal = hashFun(keys[i], n);

    if (hashTable[hashVal][0] == -1) {

      hashTable[hashVal][0] = keys[i];

    } else {
      
      int tempIdx = (hashVal + 1) % n;
      while(hashTable[tempIdx][0] != -1) {
        if(tempIdx == hashVal) {
          cout << "Hash table is full" << endl;
        }
        tempIdx = (hashVal + 1) % n;
      }

      hashTable[tempIdx][0] = keys[i];
    }
  }

  return 0;
}