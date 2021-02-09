---
home: true
actionText: Get started →
actionLink: /en/guide/quickstart/
features:
- title: Consistency
  details: No matter what framework used and how structured, you can use this package to implement consistent command line scripts.
- title: Flexibility
  details: You can extend by plugins, you can override commands, config, and you can hook with core or other plugins.
- title: Efficiency
  details: The command rule is simple, so it easy to use, if you use it frequently, it can dramatically improve you performant.
footer: Enterprise level Node CLI building rules
---

```bash
# Install globally to your local machine.
npm install -g @semo/cli
semo help

# Install to your project
cd YOUR_PROJECT
npm install @semo/cli
semo init
semo generate command test

# Use application convention to reduce first level commands
npm install semo-plugin-application
semo generate command application/test --extend=application
```