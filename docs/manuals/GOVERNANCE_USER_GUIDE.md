# Governance Studio: User Guide

## 1. Introduction
The Governance Studio allows you to define rules that control how data is entered, validated, and displayed in the system. 

## 2. Creating a Policy
1.  Navigate to **System Config > Governance**.
2.  Click the **(+)** button to create a new Policy.
3.  **Name:** Give it a descriptive name (e.g., "Vendor Email Validation").
4.  **Key:** The system will auto-generate a unique ID.

## 3. The Logic Builder
The builder allows you to define **Conditions** and **Consequences**.

### Condition Operators
| Operator | Logic | Example |
| :--- | :--- | :--- |
| **Equals** | Exact Match | `Role == 'Admin'` |
| **Contains** | Partial Match | `Email contains '@company.com'` |
| **Matches Regex** | Pattern Match | `SKU matches '^[A-Z]{3}-\d{4}$'` |
| **Is Empty** | Null Check | `Phone Number is empty` |

### Consequences (Actions)
* **Integrity:**
    * `BLOCK`: Prevents the user from saving. Shows an error message.
    * `WARN`: Shows a yellow toast message but allows saving.
* **UI Behavior:**
    * `HIDE`: Removes the field from the form.
    * `DISABLE`: Greys out the field (Read-Only).
    * `REQUIRE`: Adds a red asterisk (*) and enforces entry.
* **Automation:**
    * `SET_VALUE`: Automatically fills a field (e.g., If `Status='Shipped'`, set `Date=Today`).

## 4. Testing Your Rules (Safety Mode)
**Never publish a rule without testing.**
1.  Scroll down to the **Simulation Lab**.
2.  In the "Input Context" box, type a mock JSON object representing your data.
    ```json
    {
      "host": {
        "email": "test@gmail.com",
        "age": 15
      }
    }
    ```
3.  Click **Test Logic**.
4.  The system will tell you if the rule would Block, Warn, or Mutate data.

## 5. Versioning & History
* **Save Draft:** Saves your work but keeps the policy **Inactive**. Safe for experimenting.
* **Publish Version:** Saves and immediately **Activates** the policy for all users.
* **History:** Click the "History" button in the header to see a timeline of changes.
* **Restoring:** If a new rule causes issues, open History, find the previous "Good" version, and click **Restore**. This creates a new active version with the old logic.

## 6. The Switchboard (Activation)
Creating a policy does not automatically run it. You must connect it using the **Switchboard**.
1.  Go to the **Switchboard** tab.
2.  Click **Connect Policy**.
3.  Select your Policy and the **Scope** (e.g., "Global" or "On Create Only").

