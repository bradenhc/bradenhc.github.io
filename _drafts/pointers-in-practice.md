---
layout: post
header: default
title: "Pointers in Practice"
author: Braden Hitchcock
tags: ["C++", "Ownership", "Memory Management", "Maintainability"]
---

"I hate C and C++ because I have to deal with pointers." That's something I've
heard quite often. Unfortunately, you can't take this statement at face value
most of the time. In fact, almost always the real reason developers try to avoid
pointers is because pointers tend to make things more complicated.

There is nothing inherently wrong with pointers. At its core, a pointer is
simply a value that represents an address in memory. Other programming languages
use these memory address representations all the time.

Java? The `new` keyword creates an object on the heap. What you get back is a
pointer.

JavaScript? Python? Pointers are everywhere in those languages, you just don't
ever see them in the syntax. You even find pointers in newer programming
languages like Go and Rust. They are unavoidable.

I've found that when developers say they _hate_ pointers, they are really saying
two things:

First, they hate **manual memory management**. They don't like having to
remember to clean up something when they're done. In C this is definitely a
place developers can shoot themselves in the foot. In C++, things get a little
easier with constructors and destructors, and using `new` and `delete` instead
of `malloc` and `free`, but manual memory management can still make it
challenging to reason about the system. If I see a pointer, what should I do
with it? Is it null? Do I need to free the value it points to, or will someone
else free it? Not being able to answer these questions is where most people fall
into traps, even when using languages that provide their own memory management.

Second, they hate how **unreadable** and **unmaintainable** code _can_ get when
you deal with lots of pointers. Strongly typed languages are useful because the
types allow us to reason about the system more confidently; however, when you
see a pointer to a type you have lots of questions.

- Where was it created?
- What is its purpose?
- Do I own it?
- Do I need to check it for validity, or was that done somewhere else?
- How many parts of the system are using it?

These and other questions are hard to answer without additional context about
the coding style or underlying assumptions of the system.

## Why Pointers?

So if pointers are so complicated, why do we need them?

The simple answer is that we need them because we want our programs to work in
the real world.

In the real world, programs aren't closed systems. They interact with users and
receive data from multiple sources concurrently, with each type of data varying
in size and frequency. If a program is going to do anything useful, it needs to
be dynamic. At a low level, this means frequently requesting new memory from the
operating system to contain those dynamic values and releasing that memory when
a program is done so that other dynamic processes using the same hardware can do
their jobs.

In this way, pointers are what tie our program back to the dynamic memory it
needs to be useful. This means we can't get rid of them without introducing
limitations on the systems we build.

## Overcoming Our Fear of Pointers

There is one principle that, in my experience, is a game changer in
understanding how to use pointers properly.

That principle is **ownership**.

To be honest, I never thought much about what ownership meant until I started
programming in Rust. Rust is built around ownership, and it is one of the
reasons it is such a powerful and ergonomic language.

Ownership forces developers to invert their traditional way of thinking about
how their programs work. Normally we think of variables in our system first
instead of values. We see ourselves interacting with variables, passing them to
functions, and referencing them in multiple places. If, instead, we think first
about values, reasoning about variables becomes a matter of understanding the
lifetime of a value.

The lifetime of a value is tied directly to the variable that owns it.

## Pointers in Practice: C++

So how do we make this principle of ownership work in C++? Fortunately, ever
since C++11, there has been a way to communicate ownership with smart pointers.

### Smart Pointers

Number 1: because they clearly communicate intent Number 2: because they make
memory management easier

#### Unique Pointers

#### Shared Pointers

#### Weak Pointers

### References

### Reference Wrappers

### Raw Pointers

### Crunching the Numbers

Performance of raw pointers

## Prefer Smart Pointers

| Type                        | Rule                                                                 |
| :-------------------------- | :------------------------------------------------------------------- |
| `std::unique_ptr<T>`        | Start here. Use when a value has one owner.                          |
| `std::shared_ptr<T>`        | Use when a value has multiple owners (can convert unique to shared). |
| `std::weak_ptr<T>`          | Prefer not to use, but can use when borrowing a shared pointer.      |
| `T&`                        | Use for borrowing values.                                            |
| `std::reference_wrapper<T>` | Use for borrowing values in STL containers.                          |

_Table 1: Deciding which type of pointer to use in C++_
