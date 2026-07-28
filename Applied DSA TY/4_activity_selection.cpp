/*
Implement a problem of activity selection problem with K persons. 
Statement: Given two arrays S[] and E[] of size N denoting starting and 
closing time of the shops and an integer value K denoting the number 
of people, the task is to find out the maximum number of shops they 
can visit in total if they visit each shop optimally based on the following 
conditions:  
 A shop can be visited by only one person. 
 A person cannot visit another shop if its timing collides with it.
*/

#include <iostream>
#include <vector>
#include <algorithm>
#include <map>

using namespace std;

bool compare(pair<int,int> a, pair<int,int> b)
{
    return a.second < b.second;
}

int activitySelection(int s[], int e[], int k, int n)
{
    vector<pair<int,int>> time;
    map<int,int> freq;

    for(int i = 0; i < n; i++)
    {
        time.push_back({s[i], e[i]});
    }

    sort(time.begin(), time.end(), compare);

    for(int i = 0; i < n; i++)
    {
        freq[time[i].second]++;
    }

    int ans = 0;

    for(auto it : freq)
    {
        ans += min(it.second, k);
    }

    return ans;
}

int main()
{
    //int s[] = {1, 3, 0, 5};
    //int e[] = {2, 4, 6, 7};
    int n;
    int k;
    cout << "Enter n (number of shops):";
    cin >> n;

    cout << "Enter k (number of persons):";
    cin >> k;

    int s[n];
    int e[n];

    cout << "Enter start time of shops (s[]):";
    for(int i = 0; i < n; i++) 
      cin >> s[i];

    
    cout << "Enter end time of shops (e[]):";
    for(int j = 0; j < n; j++) 
      cin >> e[n];

    
    cout << "Maximum shops that can be visited : " << activitySelection(s, e, k, n);

    return 0;
}