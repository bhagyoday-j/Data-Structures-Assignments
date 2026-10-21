class Solution {
public:
    int best = INT_MAX;

    void backtrack(vector<int>& cookies,
                   vector<int>& sums,
                   int index) {

        // All bags are distributed
        if (index == cookies.size()) {
            int unfairness = 0;

            for (int total : sums) {
                unfairness = max(unfairness, total);
            }

            best = min(best, unfairness);
            return;
        }

        // Try assigning the current bag to each child
        for (int i = 0; i < sums.size(); i++) {

            // Skip children with identical current totals
            bool duplicate = false;

            for (int j = 0; j < i; j++) {
                if (sums[i] == sums[j]) {
                    duplicate = true;
                    break;
                }
            }

            if (duplicate) {
                continue;
            }

            // Assign the bag
            sums[i] += cookies[index];

            // Current maximum
            int currentMax = 0;

            for (int total : sums) {
                currentMax = max(currentMax, total);
            }

            // Branch and bound:
            // This branch cannot improve the answer
            if (currentMax < best) {
                backtrack(cookies, sums, index + 1);
            }

            // Undo assignment
            sums[i] -= cookies[index];

            // All children are currently empty:
            // placing the bag in any one is equivalent
            if (sums[i] == 0) {
                break;
            }
        }
    }

    int distributeCookies(vector<int>& cookies, int k) {
        best = INT_MAX;

        // Assign larger bags first
        sort(cookies.rbegin(), cookies.rend());

        vector<int> sums(k, 0);

        backtrack(cookies, sums, 0);

        return best;
    }
};