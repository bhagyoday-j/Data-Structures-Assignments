/*
A medical record system is a software application used to manage medical records including patient information, medical history, and treatment plans. hash table can be used to store and retrieve patient records efficiently.
*/

#include <iostream>
#include <vector>
using namespace std;

class Patient {
public:
  int id;
  string name;
  string medicalHistory;
  string treatmentPlan;


  Patient(int id, string name, string medicalHistory, string treatmentPlan) {
    this->id = id;
    this->name = name;
    this->medicalHistory = medicalHistory;
    this->treatmentPlan = treatmentPlan;
  }
};

int hashFn1(int key, int n) {
  return key % n;
}

int hashFn2(int key, int n) {
  // int M = 7; // Prime number Always less than n
  // return M - (key % M) ;
  return 1+(key%11);
}

bool isFull(const vector<Patient*>& ht) {
  for(int i = 0; i < ht.size(); i++) {
    if(ht[i] == nullptr) {
      return false;
    }
  }
  return true;
}

void insert(vector<Patient*>& ht, Patient* patient) {
  int key = patient->id;

  if(isFull(ht)) {
      cout << "Hash table is full. Cannot insert key: " << key << endl;
      return;
  }

  int n = ht.size();

  int u = hashFn1(key, n);
  int v = hashFn2(key, n);

  int i = 0;
  while(i < n) {
    int idx = (u + i*v) % n;

    if(ht[idx] == nullptr) {
      ht[idx] = patient;
      return;
    }

    i++;
  }

  cout << "Failed to insert key: " << key << endl;
}

bool search(const vector<Patient*>& ht, int key) {
  int n = ht.size();

  int u = hashFn1(key, n);
  int v = hashFn2(key, n);

  int i = 0;
  while(i < n) {
    int idx = (u + i*v) % n;

    if(ht[idx] == nullptr) {
      return false; 
    }

    if(ht[idx]->id == key) {
      return true; 
    }

    i++;
  }

  return false; 
}

void display(const vector<Patient*>& ht) {
  cout << endl;
  cout << "-----------Patient Information-------------" << endl;

  cout << "index\tId\tName" << endl;
  for(int i = 0; i < ht.size(); i++) {
    if(ht[i] != nullptr) {
      cout << i << "\t" << ht[i]->id << "\t" << ht[i]->name << endl;
    } else {
      cout << i << "\t" << "null" << endl;
    }
  }
  cout << "-------------------------------------------\n" << endl;
}

int main() {

  int n;
  cout << "Enter size of hash table: ";
  cin >> n;
  vector<Patient*> hashTable(n, nullptr);

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
        int id;
        string name, medicalHistory, treatmentPlan;
        cout << "Enter ID to insert: ";
        cin >> id;

        cout << "Enter patient name: ";
        getline(cin >> ws, name); 

        cout << "Enter medical history: ";
        getline(cin >> ws, medicalHistory); 

        cout << "Enter treatment plan: ";
        getline(cin >> ws, treatmentPlan);

        Patient* patient = new Patient(id, name, medicalHistory, treatmentPlan);
        insert(hashTable, patient);
        break;
      }

      case 2: {
        display(hashTable);
        break;
      }

      case 3: {
        int id;
        cout << "Enter ID to search: ";
        cin >> id;
        if(search(hashTable, id)) {
          cout << "Patient found." << endl;
        } else {
          cout << "Patient not found." << endl;
        }
        break;
      }

      case 4: {
        for(auto p : hashTable) {
          delete p;
        }
        return 0;
      }

      default: {
        cout << "Invalid choice. Try again." << endl;
      }
    }
  }

  return 0;
}