/*
Implement Coin Change problem.  
Statement: - Given an integer array of coins [ ] of size N representing different types of currency and an integer sum, The task is to find the number of ways to make sum by using different combinations from coins[]. 
Also display all different combinations
*/

/*
#include <iostream>
#include <vector>
using namespace std;

int helper(vector<int>& coins, int sum, int i)
{
    if(sum == 0)
        return 1;

    if(sum < 0)
        return 0;

    if(i >= coins.size())
        return 0;

    int take = helper(coins, sum - coins[i], i);
    int skip = helper(coins, sum, i + 1);

    return take + skip;
}

int coin_change(vector<int>& coins, int sum)
{
    return helper(coins, sum, 0);
}

int main()
{
    vector<int> coins = {1, 2, 3};
    int sum = 4;

    cout << coin_change(coins, sum);

    return 0;
}
*/

#include <iostream>
#include <vector>
using namespace std;

int ans = 0;

void helper(vector<int>& coins, int sum, int i, vector<int>& curr)
{
    if(sum == 0)
    {
        for(int coin : curr)
            cout << coin << " ";
        cout << endl;
        ans++;
        return;
    }

    if(sum < 0 || i >= coins.size())
        return;

    // Take current coin
    curr.push_back(coins[i]);
    helper(coins, sum - coins[i], i, curr);
    curr.pop_back();

    // Skip current coin
    helper(coins, sum, i + 1, curr);
}

void coinChange(vector<int>& coins, int sum)
{
    vector<int> curr;
    ans = 0;
    helper(coins, sum, 0, curr);

    cout << "Number of ways are : " << ans << endl;
}

int main()
{
    int t;
    cout << "Enter Number of test cases :";
    cin >> t;
    
    while(t--) 
    {
        int sum;
        int n;

        cout << "Enter coin array size : ";
        cin >> n;

        vector<int> coins(n);

        cout << "Enter Array Elements : ";
        for(int i = 0; i < n; i++) 
            cin >> coins[i];

        cout << "Enter Requried sum : ";
        cin >> sum;

        coinChange(coins, sum);
    }

    return 0;
}