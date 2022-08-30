---
layout: post
header: default
title: "CMake in Two Words"
author: Braden Hitchcock
---

CMake is a fantastic build system generator. It provides a usable, maintainable,
and portable solution to one of the more complicated aspects of C++ development.
That said, it's not without its history, and it can be easy to get lost in the
plethora of commands and variables used to configure our projects.

I've had the opportunity to work intimately with CMake over the past year as
part of a small team tasked with improving the DevOps process for our flagship
software system. We're headed towards microservices, which means a greater
number of isolated code repositories. Without a proper build system, this added
layer of developmental complexity could become unmaintainable, no matter what
programming language you use.

Since most of our existing code and expertise is in C++, we wanted to stick with
that language while leaving our legacy Makefile build system behind in favor of
a more maintainable alternative. CMake was the clear choice for us.

But there was only so much we could learn from tutorials. By their nature,
tutorials are great at explaining the _how_, but they don't go into a lot of
detail about the _why_, which we knew we would need to understand in order to
develop an effective solution that could be applied to all of the applications
and libraries in a complex distributed system.

After carefully studying documentation and writing lots of CMake files, I found
that, at its most fundamental level, CMake really isn't that complicated at all.

## Two Words

My objective when trying to master a new tool or technology is to boil it down
to its essence. Understanding core principles creates a reference point I can
always come back to when I start exploring more advanced aspects of a tool.

The more I've worked with CMake, the more I've come to realize that the entire
suite of CMake features are built around two fundamental abstractions.

These abstractions are **targets** and **properties**.

Let's explore the implications of these two concepts as they relate to
generating build systems with CMake.

## Targets

The first sentence in the [CMake build system documentation][1] states, "A
CMake-based build system is organized as a set of high-level logical targets". I
was familiar with the concept of a target from my experience with Makefiles,
which was a dominant way to build C++ projects in the past, so this felt like a
natural starting place for CMake.

A _target_ is essentially a definition of a desired artifact.

There are three primary types of targets in CMake: executables, libraries, and
commands. We can write `CMakeLists.txt` files that contain a series of commands
that create and configure these targets. CMake takes the target configuration
and uses it to generate the actual build files that will be used to perform the
build (e.g. Unix Makefiles or Visual Studio project files).

Executable targets create binary artifacts that your system can run as a
program.

Library targets create binary artifacts that encapsulate shared logic that can
be used by multiple other executable and library targets, even during runtime
(e.g. dynamic shared-object libraries).

Custom command targets execute arbitrary commands during the build phase. These
targets can be associated with other targets in the build system as dependencies
so that the commands they define execute at the right time.

It's important to be aware that are many sub-types of each of these targets. We
won't go into detail on each of them here, but feel free to check out Figure 1
at the end of this post for a conceptual map of how targets and properties
relate to each other. That map has helped me wrap my head around how I can
structure my project in CMake for maximum maintainability and reusability.

## Properties

Every target in CMake is composed of properties. Properties define aspects of
the target like what its name is, what include directories it needs in order to
find the header files it uses, what it should link against, and how it should be
installed.

There is a plethora of commands provided by CMake that we can use to set and
modify these properties. There is the `set_target_properties` command, which
lets us explicitly set certain properties of a target by using the property's
name. But even commands like `target_link_libraries`,
`target_include_directories`, and `target_compile_definitions` are essentially
just wrappers that modify target properties.

Some properties even inherit from global CMake variables. For example, the
`CMAKE_INSTALL_PREFIX` variable helps control where a target's install location
is.

Another important aspect of properties is their visibility. There are three
levels of visibility: `PUBLIC`, `PRIVATE`, and `INTERFACE`.

- `PUBLIC` properties are propagated to any targets that link against their
  target. They also apply to the owning target while it is being built.
- `PRIVATE` properties do not propagate to any targets that link against their
  target. They only apply to their owning target while it is being built.
- `INTERFACE` properties, like `PUBLIC` ones, propagate to any targets that link
  against their owner; however, `INTERFACE` properties don't apply to the owning
  target while it is being built. These are useful especially when dealing with
  header-only libraries, which don't actually have any built artifacts but may
  have properties you want to propagate to other targets that use them.

Using these three levels of visibility, we are easily able to control target
configuration and produce the artifacts we need.

You can see a complete list of the properties available in CMake [in their
documentation][2].

## Conclusion

Every command and variable CMake exposes to developers revolves around the
creation of targets and the modification of their properties. Using executable,
library, and command targets, we can generate a build system that gives us
maximum control over every aspect of our build artifacts, increasing the overall
maintainability of the system.

While at its core CMake is simple, it isn't always simple to work with. Like any
mature tool it has a history, and sometimes history can make things more
confusing. I've found this concept map useful for understanding how all these
parts of CMake interact with each other. Hopefully you will find it useful too
and will use it to improve the quality of your CMake projects and ultimately
eliminate the headaches associated with building C++ programs
:slightly_smiling_face:

![CMake Concepts](/public/images/posts/cmake-concepts.png "Fundamental CMake Concepts")
_Figure 1: Fundamental CMake organization of targets, properties, and their
types_

[1]: https://cmake.org/cmake/help/latest/manual/cmake-buildsystem.7.html
[2]: https://cmake.org/cmake/help/latest/manual/cmake-properties.7.html
