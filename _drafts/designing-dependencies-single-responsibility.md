---
layout: post
header: default
title: "Back to Basics: Decomposing the Single Responsibility Principle"
author: Braden Hitchcock
---

Any significantly-sized software application will have dependencies. They are
unavoidable. In some instances these dependencies are external to our code, such
as when relying on third-party components for functionality. More often than
not, however, they exist inside the code we have direct control over. We create
and introduce them because we need to&mdash;because we recognize that they are
essential in order to keep our software adaptable and maintainable.

The problem with dependencies is that they never stay the same. Changing
requirements cause our software to live in a state of constant evolution. When
not controlled, this state inherently makes our code more fragile. Thus,
dependencies become one of the primary sources of software degradation. As
Robert C. Martin put it in [his writings on patterns of
design][patterns-and-design]:

> "What kind of changes cause designs to rot? Changes that introduce new and
> unplanned for dependencies. ... It is the dependency architecture that is
> degrading, and with it the ability of the software to be maintained."
>
> <small>Robert C. Martin</small>

## SOLID Design

Fortunately, there are principles we can apply to our software to help manage
the dependencies in our system. Five of these principles were [proposed by
Martin in 2000][patterns-and-design] and later organized into an acronym by
Michael Feathers:

- **S**ingle Responsibility Principle
- **O**pen-Closed Principle
- **L**iskov Substitution Principle
- **I**nterface Segregation Principle
- **D**ependency Inversion Principle

While these principle were originally identified to assist with object-oriented
design, at their core we can apply them across all paradigms of programing. In
this article, we will look more closely at the Single Responsibility Principle
and how we can use it to design component interactions that are adaptable,
flexible, and maintainable.

## The Single Responsibility Principle

[patterns-and-design]:
  https://web.archive.org/web/20150906155800/http://www.objectmentor.com/resources/articles/Principles_and_Patterns.pdf
