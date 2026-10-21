class Solution {
public:
    vector<string> result;

    void backtrack(string& s, int index,
                   vector<string>& parts) {

        // Four sections are created
        if (parts.size() == 4) {
            if (index == s.size()) {
                result.push_back(
                    parts[0] + "." +
                    parts[1] + "." +
                    parts[2] + "." +
                    parts[3]
                );
            }
            return;
        }

        // Try sections of length 1, 2, and 3
        for (int len = 1; len <= 3; len++) {
            if (index + len > s.size()) {
                break;
            }

            string part = s.substr(index, len);

            // Leading zero is not allowed
            if (len > 1 && part[0] == '0') {
                break;
            }

            int value = stoi(part);

            // Each section must be between 0 and 255
            if (value > 255) {
                break;
            }

            parts.push_back(part);

            backtrack(s, index + len, parts);

            // Undo the choice
            parts.pop_back();
        }
    }

    vector<string> restoreIpAddresses(string s) {
        result.clear();

        // An IP address needs 4 sections,
        // each containing 1 to 3 digits
        if (s.size() < 4 || s.size() > 12) {
            return result;
        }

        vector<string> parts;
        backtrack(s, 0, parts);

        return result;
    }
};