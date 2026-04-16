/*
      i
    /   \
2*i+1   2*i+2

parent of i is (i-1)/2


      i
    /   \
  2*i   2*i+1

parent of i is (i)/2
*/

#include <iostream>
#include <vector>
using namespace std;

void insert(vector<int>& heap, int key) {
  heap.push_back(key);

  int n = heap.size();

  int i = n - 1;

  while(i >= 1) {
    int parent = i / 2;

    if(parent >= 1 && heap[parent] < heap[i]) {
      swap(heap[parent], heap[i]);
    }

    i = parent;
  }

  cout << "Key inserted" << endl;
}

void deleteRoot(vector<int>& heap) {
  int n = heap.size();

  if(n == 1 || n == 0) {
    cout << "Heap is empty" << endl;
    return;
  }

  heap[1] = heap[n-1];
  heap.pop_back();

  n = heap.size();

  int i = 1;

  while(i < n) {
    int left = i*2;
    int right = i*2 + 1;

    int maxIdx = i;

    if(left < n && heap[maxIdx] < heap[left]) {
      maxIdx = left;
    }

    if(right < n && heap[maxIdx] < heap[right]) {
      maxIdx = right;
    }

    if(i == maxIdx) {
      break;
    } else {
      swap(heap[maxIdx], heap[i]);
    }
  }

  cout << "Root deleted" << endl;
}



bool search(vector<int> heap, int key) {
  for(int i = 1; i < heap.size(); i++) {
    if(heap[i] == key) {
      return true;
    }
  }

  return false;
}

void display(vector<int> heap) {
  cout << "Heap Array : ";
  for(int i = 1; i < heap.size(); i++) {
    cout << heap[i] << " ";
  }

  cout << endl << endl << endl;
}

int main() {

  vector<int> heap;
  heap.push_back(-1);

  while (true) {
    int ch;
    cout << "1. Insert" << endl;
    cout << "2. Delete Root" << endl;
    cout << "3. Search" << endl;
    cout << "4. Display" << endl;
    cout << "5. Exit" << endl;
    cout << "Enter your choice: ";
    cin >> ch;

    switch (ch) {
      case 1: {
        int key;
        cout << "Enter the percentage of student to insert: ";
        cin >> key;
        insert(heap, key);
        break;
      }
      case 2: {
        deleteRoot(heap);
        break;
      }
      case 3: {
        int key;
        cout << "Enter the percentage of student to search: ";
        cin >> key;
        search(heap, key) ? cout << "Student Percentage found" << endl : cout << "Student Percentage not found" << endl;
        break;
      }
      case 4: {
        display(heap);
        break;
      }
      case 5: {
        return 0;
      }
      default: {
        cout << "Invalid choice" << endl;
      }
    }
  }

  return 0;
}