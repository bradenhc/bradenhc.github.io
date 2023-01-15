---
layout: post
header: default
title: Software Design Fundamentals
author: Braden Hitchcock
---

The goal of any software application is to provide a solution to a problem.
That's what customers are willing to pay for. How long they continue to pay for
_your_ solution to their problem depends on whether or not the solution can
evolve inside the problem domain and meet their changing needs. The ability of a
solution to evolve depends heavily on its design.

This means that software design has a direct impact on profit. Unfortunately,
the design of a software system is often overlooked or thought of as secondary
to the implementation of features. In the name of "efficiency", many software
teams do not take the time to review the design of their solutions, refactor,
and keep up-to-date with current best practices. Eventually this leads to
unmaintainable software and one of two outcomes: complete rewrite or
abandonment.

My purpose here is to explore the importance of software design and provide four
fundamental principles that have helped me tremendously as I have worked on
solutions ranging from real-time data processing to web applications. To kick
things off, I'd like to start with a story.

## The Woodcutter

Once upon a time there was a woodcutter. He was a strong and extremely skilled
man. One day, a local settler hired the woodcutter to clear out a forest near
his home. The first day the woodcutter set out to work and cut down ten trees.
The settler was impressed with the performance of the woodcutter. For the next
several days, the woodcutter consistently brought down 10 trees a day.

One day, however, the woodcutter was only able to cut down nine trees.
Perplexed, he worked even harder the next day to make up the difference; but,
much to his dismay, he was only able to bring down eight trees. This trend
continued over the next few days until, finally, after only bringing down five
trees in one day, the woodcutter came to the settler who had hired him.

"I don't understand," the woodcutter said, "I'm working harder than I ever
have&mdash;even putting in extra hours to try and make up the
difference&mdash;but I'm only able to bring down half as many trees as when I
started."

Listening to the woodcutter's plight, the settler asked, "Have you sharpened
your axe recently?"

"Sharpened my axe?" the woodcutter echoed. "No, I haven't had time. I'm too busy
cutting down trees."

## The "Why" of Software Design

This story has a number of powerful implications in the context of agile
software methods. Let's walk through the various elements of the story and
explore how they relate to software design and development.

The woodcutter represents a software **developer**. Possessing skill and
knowledge, the developer wields his axe, which represents the **code**, and uses
it to knock down trees, which represent **features**. In the beginning, the
developer finds it easy to add new features and fix bugs in the code. They
quickly and efficiently knock down every tree the client asks them to. Over
time, as the developer works more and more with the code, they find that each
feature gets harder and harder to implement, making bugs harder and harder to
find and fix. Unless the developer is constantly aware of the sharpness of their
axe, which represents the **design of the software**, growing and maintaining
the software will get more and more difficult until it it easier to just rewrite
the code than to try and redesign it.

![Software Design Woodcutter](/public/images/posts/software-design-woodcutter.png "Software Design Elements of the Woodcutter Parable")
_Figure 1: Software design elements of the Woodcutter Parable_

Unless we as software developers take time regularly to analyze and refactor the
design of our code (sharpening our axes), we run the risk of not being able to
meet the needs of our customers or pivot when doing so is crucial to product
survival.

## What is Software Design?

It is helpful when talking about a topic as broad and potentially complex as
"software design" to provide a simple definition covering its essence. Who you
ask will have in impact on the definition, but for me I think of software design
in terms of the following:

> Software design maps **requirements** to **abstractions**

In order to build a truly innovative system, you must fully understand the needs
of the customer. Customers most often communicate their needs in the form of
requirements. Although the requirements will vary by project, all of them will
ultimately fall into one of ten quality attributes.

| Quality Attribute    | Description                                                |
| :------------------- | :--------------------------------------------------------- |
| **Reliability**      | Consistently correct without malicious actors              |
| **Efficiency**       | Reduce resources used to complete a task                   |
| **Integrity**        | Maintain correct state in the presence of malicious actors |
| **Usability**        | Provide a friendly and intuitive interface                 |
| **Maintainability**  | Easy to patch, update, and refactor                        |
| **Testability**      | Easy to test and add new tests                             |
| **Flexibility**      | Use in many ways without additional modification           |
| **Portability**      | Runs on multiple platforms and configurations              |
| **Reusability**      | Use without modification in other applications             |
| **Interoperability** | Interacts well with other applications                     |

_Table 1: The Ten Quality Attributes_

The customer will help you establish which quality attributes are most important
to the system you are designing. These will be labeled as the **functional
requirements** of the system. Functional requirements consist of the quality
attributes that distinguish your system from competing systems. When identifying
these attributes, it is helpful to focus primarily on two or three, especially
if your team is small. This is useful for a few reasons:

- It reduces the complexity of the development process
- It keeps the team focused when prioritizing tasks
- It guides the team towards a deeper understanding of what the customer
  actually wants

There will also naturally be quality attributes that are important to you as a
team, but may not be directly related to what makes the system innovative. These
are called the **non-functional requirements** of your system. Often quality
attributes such as maintainability and testability fall into this category, as
those are less-often important to the customer but are critical to the team in
order to develop the software with agility.

While identifying which of these quality attributes are most important is
crucial to a successful product, identifying what doesn't matter is just as
important in agile development. Doing so allows you to focus your efforts on the
things that matter most and helps keep you from getting distracted with
implementing features that are ultimately not critical to the product's success.

Identifying your functional and non-functional requirements is a fundamental
prerequisite to software design. Once you know _what_ you are building, _who_
you are building it for, and _why_ you are building it, you can focus on _how_
you should build it.

## Four Guiding Principles of Software Design

Effective software design isn't a skill you can acquire overnight, but the key
to getting there faster is to develop and maintain a design oriented mindset. To
help you get started with developing this mindset, I'd like to suggest four
guiding principles of software design that have helped me as I've worked on
designing new systems and rearchitecting old ones.

> When designing a software solution, prefer:
>
> 1. Modules over monoliths
> 2. Interfaces over implementations
> 3. Correctness over completeness
> 4. Collaboration over control

Let's explore each of these principles in detail to see how they can help us
design robust software solutions.

### Modules over Monoliths

The word [_monolithic_](https://www.merriam-webster.com/dictionary/monolithic")
means, "constituting a massive undifferentiated and often rigid whole". The key
word here is _rigid_&mdash;a monolith by its nature is not flexible and resists
change, growth, and adaptation.

A [_module_](https://www.merriam-webster.com/dictionary/module), on the other
hand, is "an independently operable unit... constructed for flexibility and
variety in use". Modules can grow and develop in isolation of the rest of the
system, but provide functionality that, when put together with other modules,
provides a complete solution.

The principle of modules over monoliths takes its roots from
[the UNIX philosophy](./better-tools-unix-philosophy), which emphasizes building
simple, short, clear, modular, and extensible code. Modular components are
easier to develop, test, deploy, and maintain. They clearly define their
dependencies, inputs, and outputs so that other components are able to interact
with them. Smaller units of code also accommodate change much better than
tightly coupled monolithic codebases, which is important because we live in a
fast-paced industry. The world of software is constantly evolving, and in order
to "keep up" with the changes our code needs to be easily accessible.

### Interfaces over Implementation

[_Interfaces_](https://www.merriam-webster.com/dictionary/interface) are "the
place at which independent and often unrelated systems meet and act on or
communicate with each other".

An
[_implementation_](https://www.merriam-webster.com/dictionary/implementation),
however, is "the process of making something active or effective". Already this
implies that implementations focus on details, and details will often change
with requirements. When components of a system communicate with each other using
specific details, they increase the strength of the connections between them
(called _coupling_), making it harder for the system to adapt in the future.

Software component interfaces define the "public" facing behavior of the
component. "Public" in this sense may just mean what is exposed to other
classes/components in your system. The goal then is to strive for loosely
coupled, highly cohesive services with well-defined usage contracts so other
applications/components of your system can integrate with your solution easily.

Since good interfaces are the key to designing modular code, I find it helpful
to remember the acronym K.I.S.S. when building them: **K**eep **I**t **S**hort
and **S**imple. If your interface begins to feel complex, it's most likely
because your module is trying to do too much. When you detect this, look for a
way to refactor the module in to multiple modules, each with their own smaller
interface, to keep complexity down and increase component maintainability and
usability.

### Correctness over Completeness

A [_correct_](https://www.merriam-webster.com/dictionary/correct) solution
"conforms to an approved or conventional standard or required condition".

A [_complete_](https://www.merriam-webster.com/dictionary/complete) solution has
been "[brought] to an end and especially into a perfected state".

The difference between the two is subtle, but it relates directly to
understanding which quality attributes _not_ to focus on and which features
_not_ to prioritize. It can be tempting to over-engineer a solution, but this
often results in wasted effort on a feature that the customer doesn't really
care about anyways. Leave room in your design for extensibility, but don't try
to predict the future and implement all the features up-front. One of the
greatest attributes of a well-designed system is it's ability to be refactored.
More often than not, refactoring will be faster than paying back technical debt
for incorrect assumptions made early in the implementation.

It can be tempting to add that "one cool feature you know they'll love", but
that isn't a good enough reason to add a feature. Solve for the current problem.
The faster you can meet your functional requirements, the more likely you are to
beat out the competition. Focusing on correctness will also demonstrate to the
customer that you know how to prioritize and work effectively, which will
increase their trust in you. Strong customer relationships is one of the keys to
a sustainable business solution.

Remember: Focusing on _correctness_ increases _agility_, which boosts customer
_satisfaction_ and _trust_, which leads to increased _profits_.

### Collaboration over Control

[_Collaboration_](https://www.merriam-webster.com/dictionary/collaborate) means
"to work jointly with others or together especially in an intellectual
endeavor".

[_Control_](https://www.merriam-webster.com/dictionary/control) implies
exercising "restraining or directing influence over".

This may appear to be a no-brainer, but two or more heads are better than one.
The more peers you can call on to assist in your design, the more well-thought
out and comprehensive that design will be. Sometimes sharing our ideas can make
us uncomfortable. We may wonder if our peers will approve, or we may selfishly
want the design to be our own; however, if there is one thing I have learned in
regards to this principle, it is this:

> You will never regret documenting your design and reviewing it out loud with
> someone else.

The reviewer doesn't have to be technical, either. Sometimes having a
non-technical reviewer can be beneficial because it forces you to understand
your own design deeply enough to explain all its elements simply. That said,
having a technical reviewer is still a must, but be mindful that such a reviewer
with experience in software may assume what you mean if it isn't explained
clearly enough, which can lead to miscommunication and be detrimental to your
design. It is always important to be able to clearly communicate your design, no
matter who you are talking to.

Take advantage of opportunities to review designs on your team, even if you
don't feel like you have the necessary experience. One of the best ways to learn
is to participate. When you are asked to review someone's design, remember:

- You don't have to be an expert, but you do have to **listen**
- Don't criticize. If you see an area of improvement, remember the **sandwich
  method**: say something positive, then suggest improvements, and end with
  something positive again.

## Sharpen the Axe

Software design has a direct impact on the effectiveness and profitability of
your solution. Good software design focuses on core customer requirements,
mapping them to abstractions using modular components with well-defined
interfaces. Good software designers work together and seek feedback from their
peers so that they can catch as many potential pitfalls as possible before
committing to a design.

The greatest thing about these principles is that they are very agile. It may
take some time to learn them and become proficient in them, but each principle
fits well into agile methodologies and will enable you to design good solutions
faster, meet customer requirements better, and make your customer relationships
stronger.

---

##### Acknowledgements

I'd like to thank Christopher Scaffidi for teaching me most of what I've learned
about agile methodologies, requirements, and quality attributes. I also want to
thank Jonathan Knez for trusting me enough, even as an intern many years ago, to
give me multiple opportunities to design software solutions and implement those
solutions in real-life situations. The knowledge and experience I have gained
from these two quality individuals has given me the boost I need in my
educational and professional pursuits.

---
