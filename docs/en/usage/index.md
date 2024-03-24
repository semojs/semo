# Overview

As `Semo` provides almost no direct benefits, it is necessary to elaborate on how to leverage `Semo` effectively, from its original design perspective. `Semo` is designed to improve the efficiency of enterprise-level project development, so anywhere that can be solved through code is a suitable application for `Semo`.

## Division by Project Stage

Depending on the stage of the project, `Semo` can play a role in various phases:

- Project initiation phase: Quick initialization of projects
- Development phase: Validate input and output of methods, encapsulate infrastructure, and reduce wheel reinvention by accessing core methods quickly
- Maintenance phase: Write a large number of management commands or operation and maintenance scripts
- Online troubleshooting: When bugs occur online and can only be reproduced online, use `REPL` to step closer to the truth
- Online operations and maintenance: Use well-written scripts and commands to easily solve various requirements proposed by stakeholders, thereby improving trust between departments

## Division by Form

`Semo` fully considers various usage scenarios, and its role varies in different scenarios:

- Developing plugins: Different plugins have different functionalities but consistent code styles
- Project integration: Provide command-line infrastructure for projects; if combined with other plugins, even the entire project can be built on `Semo`
- Solutions: Provide scaffolding for various business scenarios, precipitate best practices, and improve the startup speed of new projects
- Distribution: Based on solutions, further integrate to build complete and usable products, thus generating commercial value

The division here is not absolute, and there is no scenario that must be addressed by `Semo`. Moreover, there are countless solutions to any problem encountered. The purpose of `Semo` is to provide consistency, reduce redundant development, improve communication efficiency, and continuously solidify enterprise technical capabilities.