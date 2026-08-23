#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>
using namespace std;

bool canFinish(vector<int>& tasks, int D, int capacity) {
    int days = 1;
    int currentWork = 0;

    for (int task : tasks) {
        if (currentWork + task <= capacity) {
            currentWork += task;
        } else {
            days++;
            currentWork = task;
        }
    }

    return days <= D;
}

int minWorkPerDay(vector<int>& tasks, int D) {
    int low = *max_element(tasks.begin(), tasks.end());
    int high = accumulate(tasks.begin(), tasks.end(), 0);

    while (low < high) {
        int mid = low + (high - low) / 2;

        if (canFinish(tasks, D, mid))
            high = mid;
        else
            low = mid + 1;
    }

    return low;
}

int main() {
    // vector<int> tasks = {3, 2, 2, 4, 1, 4};
    // int D = 3;

    int n;
    int D;
    cout << "Enter size of task :";
    cin >> n;

    vector<int> tasks(n);

    cout << "Enter tasks :";
    for(int i = 0; i < n; i++) {
        cin >> tasks[i];
    }

    cout << "Enter Number of days :";
    cin >> D;

    cout << "Minimum work per day = "
         << minWorkPerDay(tasks, D) << endl;

    return 0;
}