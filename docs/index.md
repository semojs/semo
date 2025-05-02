---
layout: home

hero:
  name: Semo
  text: More than a scaffold
  tagline: A unified style solution for command-line scripts
  actions:
    - theme: brand
      text: Get Started →
      link: /guide/quickstart/
features:
  - title: Consistent
    details: Regardless of the framework or abstraction layers used in a Node project, this framework can be used to implement command-line scripts with a unified style.
  - title: Extensible
    details: Plugins can be extended, commands can be overridden, configurations can be overwritten. Using a hook mechanism, it can interact with hooks defined by built-in or third-party plugins.
  - title: Efficient
    details: High development efficiency due to simple rules, and high work efficiency due to frequent use.
---

```bash
# For local environments, global installation is generally recommended
npm install -g @semo/cli
semo help

# First time integrating into a project
cd YOUR_PROJECT
npm install @semo/cli
semo init
semo generate command test

# Use the application command-line specification
npm install semo-plugin-application
semo generate command application/test --extend=application
```
