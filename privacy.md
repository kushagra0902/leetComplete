# Privacy Policy

**Last Updated:** June 2026

## Introduction

LeetComplete is a Chrome extension designed to provide intelligent C++ autocomplete and code suggestions for the LeetCode online editor.

Your privacy is important. This Privacy Policy explains what information the extension accesses, how it is used, and what data (if any) is collected or shared.

---

## Information the Extension Accesses

To provide autocomplete functionality, LeetComplete temporarily reads the source code currently open in the LeetCode editor.

This information is accessed solely to:

* Parse C++ code using Tree-sitter.
* Build a temporary semantic representation of the current file.
* Generate autocomplete suggestions.
* Provide keyword and STL member completions.

---

## Data Collection

LeetComplete **does not collect** any personal information.

The extension does **not** collect:

* Names
* Email addresses
* Passwords
* Authentication tokens
* Payment information
* Location information
* Browsing history
* Personally identifiable information

---

## Source Code Privacy

Your source code is processed **entirely on your local device**.

LeetComplete does **not**:

* Upload your code to external servers.
* Store your code remotely.
* Share your code with third parties.
* Use your code for analytics or machine learning.

All parsing and autocomplete generation are performed locally within your browser.

---

## Data Sharing

LeetComplete does **not** sell, share, or transfer user data to any third party.

---

## Remote Code

LeetComplete does not download or execute remote JavaScript or WebAssembly.

All executable code, including the Tree-sitter runtime and C++ grammar, is packaged with the extension distributed through the Chrome Web Store.

---

## Permissions

The extension requests access only to LeetCode pages:

```
https://leetcode.com/*
```

This permission is required to access the Monaco editor and provide autocomplete functionality.

The extension does not access unrelated websites.

---

## Cookies

LeetComplete does not create, modify, or read cookies for its own purposes.

---

## Changes to This Policy

This Privacy Policy may be updated from time to time. Any future changes will be published at this page.

---

## Contact

If you have questions regarding this Privacy Policy, please open an issue on the project's GitHub repository or contact the developer through the contact information provided on the Chrome Web Store listing.
