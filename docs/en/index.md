---
layout: home

hero:
  name: Semo
  text: Not just CLI scaffold
  tagline: Unified style command line script solution
  actions:
    - theme: brand
      text: Get Started →
      link: /guide/quickstart/

features:
- title: Consistent
  details: Regardless of the framework used in the Node project or how abstraction is layered, this framework can be used to implement command-line scripts with a unified style.
- title: Extensible
  details: Plugins can be extended, commands can be overridden, configurations can be overwritten, and hook mechanisms can interact with hooks defined by built-in or third-party plugins.
- title: Efficient
  details: Due to its simple rules, development efficiency is high, and due to frequent use, work efficiency is high.
footer: Standardized Command Line System Construction Specification for Enterprise-level Node Projects
---

```bash
# For local environment, global installation is generally recommended
npm install -g @semo/cli
semo help

# First integration in the project
cd YOUR_PROJECT
npm install @semo/cli
semo init
semo generate command test

# Using the application command line specification
npm install semo-plugin-application
semo generate command application/test --extend=application
```