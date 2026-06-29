# LeetComplete

LeetComplete is a Chrome extension that brings intelligent C++ autocomplete to LeetCode. It provides context-aware STL member suggestions through semantic analysis, fast keyword completion using a Trie, and allows users to choose between semantic, prefix-based, or combined completion modes.

Unlike simple text expansion tools, LeetComplete parses your code using Tree-sitter to understand variable types and provide relevant member function suggestions.

---

## Features

### Semantic Autocomplete

Get member function suggestions based on the actual type of your variable.

```cpp
priority_queue<int> pq;

pq.
```

Suggestions:

- push()
- pop()
- top()
- empty()
- size()

---

### Prefix-Based Completion

Instantly complete commonly used STL classes and keywords.

Example:

```
vec        → vector
pri        → priority_queue
unordered  → unordered_map
```

---

### Multiple Completion Modes

Choose the behavior that best suits your workflow.

- Semantic Completion
- Prefix (Trie) Completion
- Combined Mode

---

### Built for Competitive Programming

- Lightweight
- Fast
- Runs completely locally
- No external servers
- No code leaves your browser

---

## Tech Stack

- JavaScript (ES Modules)
- Monaco Editor
- Tree-sitter
- Tree-sitter C++
- Chrome Extension Manifest V3

---

# Project Structure

```
LeetComplete/
│
├── manifest.json
├── content.js
├── inject.js
│
├── parser/
├── semantic/
├── completion/
├── monaco/
├── trie/
├── utils/
│
├── tree-sitter.js
├── tree-sitter.wasm
└── tree-sitter-cpp.wasm
```

---

# Architecture

```
Monaco Editor
       │
       ▼
Completion Provider
       │
       ▼
Cursor Analyzer
       │
       ├─────────────┐
       ▼             ▼
Semantic Engine   Trie Engine
       │             │
       └──────┬──────┘
              ▼
      Completion Results
              ▼
          Monaco Popup
```

The semantic engine maintains a cached `ProgramState` generated from Tree-sitter parsing, while the Trie engine performs fast prefix lookups for keywords and STL names.

---

# Setting Up for Local Development

## 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/LeetComplete.git
cd LeetComplete
```

---

## 2. Load the Extension

1. Open Chrome or Brave.
2. Navigate to:

```
chrome://extensions
```

(or `brave://extensions` for Brave)

3. Enable **Developer Mode**.
4. Click **Load unpacked**.
5. Select the project folder containing `manifest.json`.

The extension should now appear in the extensions list.

---

## 3. Open LeetCode

Navigate to any C++ problem.

Example:

```
https://leetcode.com/problems/two-sum/
```

The extension automatically injects itself into supported problem pages.

---

# Testing

After opening a C++ problem, verify the following:

### Prefix Completion

Type:

```cpp
vec
```

Expected:

```
vector
```

---

### Semantic Completion

Type:

```cpp
priority_queue<int> pq;

pq.
```

Expected suggestions:

```
push()
pop()
top()
size()
empty()
```

---

### Completion Modes

Verify that switching between:

- Semantic
- Prefix
- Combined

changes the completion behavior accordingly.

---

# Reloading During Development

Whenever you modify the extension:

1. Save your changes.
2. Go to:

```
chrome://extensions
```

3. Click **Reload** on LeetComplete.
4. Refresh the LeetCode page.

Your latest code will now be running.

---

# Debugging

## Extension Console

Content script logs appear in the webpage's Developer Tools console.

```
F12
→ Console
```

---

## Inspect the Extension

Go to:

```
chrome://extensions
```

Click **Inspect Views** if available.

---

## Common Debugging Checks

Verify:

- Monaco has loaded.
- Tree-sitter initializes successfully.
- ProgramState is generated.
- Completion provider is registered.
- Trie is populated.
- Semantic analyzer resolves variable types correctly.

---

# How It Works

```
Editor Change
      │
      ▼
Tree-sitter Parser
      │
      ▼
Semantic Analysis
      │
      ▼
ProgramState Cache
      │
      ▼
Completion Request
      │
      ├──────────────┐
      ▼              ▼
Trie Engine    Semantic Engine
      │              │
      └──────┬───────┘
             ▼
      Monaco Suggestions
```

The parser runs when the editor content changes and updates a cached semantic representation of the program. Completion requests then query this cache instead of reparsing the entire file, keeping suggestions responsive.

---

# Current Capabilities

- Semantic STL member completion
- Trie-based keyword completion
- Configurable completion modes
- Tree-sitter C++ parsing
- Monaco integration

---

# Roadmap

- Better nested expression support
- Function signature help
- Snippet completions
- User-defined class support
- Improved type inference
- More STL coverage
- Hover information
- Go to definition

---

# Contributing

Contributions are welcome.

If you'd like to contribute:

1. Fork the repository.
2. Create a new branch.

```bash
git checkout -b feature/my-feature
```

3. Commit your changes.

```bash
git commit -m "Add feature"
```

4. Push the branch.

```bash
git push origin feature/my-feature
```

5. Open a Pull Request.

---

# License

This project is licensed under the MIT License.

---

If you find this project useful, consider giving it a ⭐ on GitHub. It helps others discover the project and motivates future development.
