#include <iostream>
#include <vector>
using namespace std;

class data {
public:
    int id;
    int chain;
    string name;

    data() {
        id = -1;
        chain = -1;
        name = "NA";
    }

    data(int i, string n) {
        id = i;
        chain = -1;
        name = n;
    }
};

int hashFunction(int ID, int n) {
    return ID % n;
}

void displayLibrary(vector<data*>& library) {
    cout << "\nIndex\tID\tName\tChain\n";

    for(int i = 0; i < library.size(); i++) {
        cout << i << "\t";

        if(library[i] == nullptr) {
            cout << "-\t-\t-";
        }
        else {
            cout << library[i]->id << "\t"
                 << library[i]->name << "\t";

            if(library[i]->chain == -1)
                cout << "-";
            else
                cout << library[i]->chain;
        }

        cout << endl;
    }
}

void addMusic(vector<data*>& library, data* newMusic) {

    int n = library.size();
    int hashVal = hashFunction(newMusic->id, n);

    // If empty
    if(library[hashVal] == nullptr) {
        library[hashVal] = newMusic;
    } else {
        int tempIdx = (hashVal + 1) % n;

        while(library[tempIdx] != nullptr) {
            if(tempIdx == hashVal) {
                cout << "Library is full\n";
                return;
            }
            tempIdx = (tempIdx + 1) % n;
        }

        library[tempIdx] = newMusic;

        // Chain update
        int chainIdx = hashVal;
        while(library[chainIdx]->chain != -1) {
            chainIdx = library[chainIdx]->chain;
        }

        library[chainIdx]->chain = tempIdx;
    }
}

bool searchMusic(vector<data*>& library, int ID) {

    int n = library.size();
    int hashVal = hashFunction(ID, n);

    int tempIdx = hashVal;

    while(tempIdx != -1) {

        if(library[tempIdx] != nullptr && library[tempIdx]->id == ID)
            return true;

        if(library[tempIdx] == nullptr)
            return false;

        tempIdx = library[tempIdx]->chain;
    }

    return false;
}

int main() {

    int n;
    cout << "Enter music library table size: ";
    cin >> n;

    vector<data*> library(n, nullptr);

    int choice;

    do {
        cout << "\n----- Music Library System -----\n";
        cout << "1. Add Music\n2. Search Music\n3. Display\n4. Exit\n";
        cout << "Enter choice: ";
        cin >> choice;

        switch(choice) {

            case 1: {
                int ID;
                string name;
                cout << "Enter Music ID: ";
                cin >> ID;
                cout << "Enter Music Name: ";
                cin >> name;

                data* newMusic = new data(ID, name);
                addMusic(library, newMusic);
                break;
            }

            case 2: {
                int ID;
                cout << "Enter Music ID to search: ";
                cin >> ID;

                if(searchMusic(library, ID))
                    cout << "Found in Library\n";
                else
                    cout << "Not Found\n";
                break;
            }

            case 3:
                displayLibrary(library);
                break;

            case 4:
                cout << "Exiting...\n";
                break;

            default:
                cout << "Invalid choice\n";
        }

    } while(choice != 4);

    return 0;
}