// Linear Probing without Replacement
#include <iostream>
#include <vector>
using namespace std;

int hashFun(int key, int n) {
    return key % n;
}

void display(vector<vector<int>>& hashTable) {
    cout << "\nIndex\tKey\tChain\n";
    for(int i = 0; i < hashTable.size(); i++) {
        cout << i << "\t";

        if(hashTable[i][0] == -1)
            cout << "-";
        else
            cout << hashTable[i][0];

        cout << "\t";

        if(hashTable[i][1] == -1)
            cout << "-";
        else
            cout << hashTable[i][1];

        cout << endl;
    }
}

void addKey(vector<vector<int>>& hashTable, int key) {
    int n = hashTable.size();
    int hashVal = hashFun(key, n);

    if(hashTable[hashVal][0] == -1) {
        hashTable[hashVal][0] = key;
    } else {
        int tempIdx = (hashVal + 1) % n;

        while(hashTable[tempIdx][0] != -1) {
            if(tempIdx == hashVal) {
                cout << "Hash table is full\n";
                return;
            }
            tempIdx = (tempIdx + 1) % n;
        }

        hashTable[tempIdx][0] = key;

        int chainIdx = hashVal;

        while(hashTable[chainIdx][1] != -1) {
            chainIdx = hashTable[chainIdx][1];
        }

        hashTable[chainIdx][1] = tempIdx;
    }
}

bool searchKey(vector<vector<int>>& hashTable, int key) {
    int n = hashTable.size();
    int hashVal = hashFun(key, n);

    int tempIdx = hashVal;

    while(tempIdx != -1) {
        if(hashTable[tempIdx][0] == key) {
            return true;
        }
        tempIdx = hashTable[tempIdx][1];
    }

    return false;
}

// void deleteKey(vector<vector<int>>& hashTable, int key) {
    
// }

int main() {

    int n;
    cout << "Enter table size: ";
    cin >> n;

    vector<vector<int>> hashTable(n, vector<int>(2, -1));

    int choice, key;

    do {
        cout << "\n1 Insert Key\n";
        cout << "2 Search Key\n";
        cout << "3 Delete Key\n";
        cout << "4 Display Table\n";
        cout << "5 Exit\n";
        cout << "Enter choice: ";
        cin >> choice;

        switch(choice) {

            case 1:
                cout << "Enter key: ";
                cin >> key;
                addKey(hashTable, key);
                break;

            case 2:
                cout << "Enter key to search: ";
                cin >> key;

                if(searchKey(hashTable, key))
                    cout << "Key found\n";
                else
                    cout << "Key not found\n";

                break;

            // case 3:
            //     cout << "Enter key to delete: ";
            //     cin >> key;
            //     deleteKey(hashTable, key);
            //     break;

            case 4:
                display(hashTable);
                break;

            case 5:
                cout << "Exiting...\n";
                break;

            default:
                cout << "Invalid choice\n";
        }

    } while(choice != 5);

    return 0;
}