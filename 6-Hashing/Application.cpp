// Music Library System using Hash Table (Linear Probing without Replacement)

#include <iostream>
#include <vector>
using namespace std;

class data {
  int id;
  string name;

  data() {
    id = -1;
    name = "NA";
  }

  data(int i, string n) {
    id = i;
    name = n;
  }
};

// Hash function to generate index
int hashFunction(int ID, int n) {
    return ID % n;
}

// Display the music library table
void displayLibrary(vector<vector<int>>& library) {
    cout << "\nIndex\tID\tChain\n";

    for(int i = 0; i < library.size(); i++) {
        cout << i << "\t";

        if(library[i][0] == -1)
            cout << "-";
        else
            cout << library[i][0];

        cout << "\t";

        if(library[i][1] == -1)
            cout << "-";
        else
            cout << library[i][1];

        cout << endl;
    }
}

// Insert a new music
void addMusic(vector<vector<int>>& library, int ID) {

    int n = library.size();
    int hashVal = hashFunction(ID, n);

    // If slot is empty
    if(library[hashVal][0] == -1) {
        library[hashVal][0] = ID;
    }
    else {

        int tempIdx = (hashVal + 1) % n;

        while(library[tempIdx][0] != -1) {

            if(tempIdx == hashVal) {
                cout << "Music library is full\n";
                return;
            }

            tempIdx = (tempIdx + 1) % n;
        }

        library[tempIdx][0] = ID;

        int chainIdx = hashVal;

        while(library[chainIdx][1] != -1) {
            chainIdx = library[chainIdx][1];
        }

        library[chainIdx][1] = tempIdx;
    }
}

// Search a music
bool searchMusic(vector<vector<int>>& library, int ID) {

    int n = library.size();
    int hashVal = hashFunction(ID, n);

    int tempIdx = hashVal;

    while(tempIdx != -1) {

        if(library[tempIdx][0] == ID) {
            return true;
        }

        tempIdx = library[tempIdx][1];
    }

    return false;
}

int main() {

    int n;
    cout << "Enter music library table size: ";
    cin >> n;

    vector<vector<int>> library(n, vector<int>(2, -1));

    int choice, ID;

    do {

        cout << "\n----- Music Library System -----\n";
        cout << "1. Add Music \n";
        cout << "2. Search Music \n";
        cout << "3. Display Music Library\n";
        cout << "4. Exit\n";
        cout << "Enter choice: ";
        cin >> choice;

        switch(choice) {

            case 1:
                cout << "Enter Music ID: ";
                cin >> ID;
                addMusic(library, ID);
                break;

            case 2:
                cout << "Enter Music ID to search: ";
                cin >> ID;

                if(searchMusic(library, ID))
                    cout << "Found in Library\n";
                else
                    cout << "Not Found\n";

                break;

            case 3:
                displayLibrary(library);
                break;

            case 4:
                cout << "Exiting Music Library System...\n";
                break;

            default:
                cout << "Invalid choice\n";
        }

    } while(choice != 4);

    return 0;
}