//dscodes@gmail.com

/*
A music library system is a software application used to manage the storage and retrieval of music tracks and albums. 
The system needs to maintain information such as title, artist, album, genre, duration, release year, and any other relevant attributes. 
The system should be able to add new music tracks, remove tracks, update the information of tracks, and search for specific tracks. 
It should also display the information of all the tracks that are present in the database. 
Use the concept of linked list to implement the above system.
*/

#include <iostream>
using namespace std;

class Node {
public:
    string title;
    string artist;
    string album;
    string genre;
    string duration;
    string releaseYear;

    Node* next;

    Node(string t, string ar, string al, string g, string d, string r) {
        title = t;
        artist = ar;
        album = al;
        genre = g;
        duration = d;
        releaseYear = r;
        next = NULL;
    }
};

class MusicLibrary {
    Node* head;
    Node* tail;

public:
    MusicLibrary() {
        head = NULL;
        tail = NULL;
    }

    // ADD MUSIC
    void addSong() {
        string t, ar, al, g, d, r;

        cout << "Enter Title : ";
        cin >> t;

        cout << "Enter Artist : ";
        cin >> ar;

        cout << "Enter Album : ";
        cin >> al;

        cout << "Enter Genre : ";
        cin >> g;

        cout << "Enter Duration : ";
        cin >> d;

        cout << "Enter Release Year : ";
        cin >> r;

        Node* newSong = new Node(t, ar, al, g, d, r);

        if (head == NULL) {
            head = tail = newSong;
        } else {
            tail->next = newSong;
            tail = newSong;
        }

        cout << "Song added successfully\n";
    }

    // DELETE LAST SONG
    void deleteSong() {
        if (head == NULL) {
            cout << "Library empty\n";
            return;
        }

        if (head == tail) {
            delete head;
            head = tail = NULL;
            cout << "Last song deleted\n";
            return;
        }

        Node* temp = head;
        while (temp->next != tail) {
            temp = temp->next;
        }

        delete tail;
        tail = temp;
        tail->next = NULL;

        cout << "Last song deleted\n";
    }

    // SEARCH BY TITLE
    void searchSong() {
        if (head == NULL) {
            cout << "Library empty\n";
            return;
        }

        string t;
        cout << "Enter title to search : ";
        cin >> t;

        Node* temp = head;

        while (temp != NULL) {
            if (temp->title == t) {
                cout << "\nSong Found!\n";
                cout << "Title: " << temp->title << endl;
                cout << "Artist: " << temp->artist << endl;
                cout << "Album: " << temp->album << endl;
                cout << "Genre: " << temp->genre << endl;
                cout << "Duration: " << temp->duration << endl;
                cout << "Release Year: " << temp->releaseYear << endl;
                return;
            }
            temp = temp->next;
        }

        cout << "Song not found\n";
    }

    // DISPLAY ALL SONGS
    void display() {
        if (head == NULL) {
            cout << "Library empty\n";
            return;
        }

        Node* temp = head;
        int i = 1;

        while (temp != NULL) {
            cout << "\nSong " << i++ << ":\n";
            cout << "Title: " << temp->title << endl;
            cout << "Artist: " << temp->artist << endl;
            cout << "Album: " << temp->album << endl;
            cout << "Genre: " << temp->genre << endl;
            cout << "Duration: " << temp->duration << endl;
            cout << "Release Year: " << temp->releaseYear << endl;

            temp = temp->next;
        }
    }
};

int main() {
    MusicLibrary ml;
    int ch;

    while (true) {
        cout << "\n1. Add Song";
        cout << "\n2. Delete Last Song";
        cout << "\n3. Search Song";
        cout << "\n4. Display All Songs";
        cout << "\n5. Exit";
        cout << "\nEnter choice: ";
        cin >> ch;

        switch (ch) {
        case 1: ml.addSong(); break;
        case 2: ml.deleteSong(); break;
        case 3: ml.searchSong(); break;
        case 4: ml.display(); break;
        case 5: return 0;
        default: cout << "Invalid choice\n";
        }
    }
}
