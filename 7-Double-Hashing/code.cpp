#include <iostream>
#include <vector>
using namespace std;

int hashFn1(int key, int n) {
  return key % n;
}

int hashFn2(int key, int n) {
  return 7 - (key % 7) ;
}

void insert(vector<int>& ht, int key) {
  int n = ht.size();

  int u = hashFn1(key, n);
  int v = hashFn2(key, n);

  int i = 0;
  while(true) {
    int idx = (u + i*v) % n;

    if(isFull(ht)) {
      cout << "Hash table is full. Cannot insert key: " << key << endl;
      return;
    }

    if(ht[idx] == -1) {
      ht[idx] = key;
      return;
    }

    i++;
  }
}

void display(const vector<int>& ht) {
  for(int i = 0; i < ht.size(); i++) {
    cout << i << ": " << ht[i] << endl;
  }
}

bool isFull(const vector<int>& ht) {
  for(int i = 0; i < ht.size(); i++) {
    if(ht[i] == -1) {
      return false;
    }
  }
  return true;
}

bool search(const vector<int>& ht, int key) {
  int n = ht.size();

  int u = hashFn1(key, n);
  int v = hashFn2(key, n);

  int i = 0;
  while(true) {
    int idx = (u + i*v) % n;

    if(ht[idx] == -1) {
      return false; // Key not found
    }

    if(ht[idx] == key) {
      return true; // Key found
    }

    i++;
  }
}

int main() {

  int n;
  cout << "Enter size of hash table: ";
  cin >> n;
  vector<int> hashTable(n, -1);

  while(true) {
    cout << "1. Insert" << endl;
    cout << "2. Display" << endl;
    cout << "3. Search" << endl;
    cout << "4. Exit" << endl;
    int ch;    
    cout << "Enter your choice: ";
    cin >> ch;

    switch (ch) {

      case 1: {
        int key;
        cout << "Enter key to insert: ";
        cin >> key;
        insert(hashTable, key);
        break;
      }

      case 2: {
        display(hashTable);
        break;
      }

      case 3: {
        int key;
        cout << "Enter key to search: ";
        cin >> key;
        if(search(hashTable, key)) {
          cout << "Key found in hash table." << endl;
        } else {
          cout << "Key not found in hash table." << endl;
        }
        break;
      }

      case 4: {
        return 0;
      }
      
      default: {
        cout << "Invalid choice. Try again." << endl;
      }
    }
  }

  return 0;
}