---
layout: post
header: default
title: "C++ Template Metaprogramming Fundamentals"
author: Braden Hitchcock
tags: [C++, Metaprogramming]
---

I'm all about effectiveness. Whenever I get the chance to learn how to solve a
problem better, reduce the amount of work I have to do, and make it easier for
other people to do their job, I take it.

In this pursuit of effectiveness, I've recently developed a keen interest in C++
template metaprogramming. This led me to discover two _absolutely outstanding_
videos from CppCon 2014 by Walter E. Brown.

- [Modern Template Metaprogramming: A Compendium, Part 1](https://www.youtube.com/watch?v=Am2is2QCvxY)
- [Modern Template Metaprogramming: A Compendium, Part 2](https://www.youtube.com/watch?v=a0FliKwcwXE)

I highly recommend watching at least Part 1, as most of the content in this post
is derived from that video.

I'd like to share with you my newfound appreciation for template metaprogramming
in C++ based on what I've learned over the past week. I believe that developing
this appreciation for yourself boils down to grasping the fundamental concepts
of the technique and understanding why they are useful.

## What is template metaprogramming?

Sounds like rocket science, but it isn't quite that scary. Template
metaprogramming is unfamiliar to most of us, which is why we tend to leave it
alone. But none of us has to be an expert to benefit from the power it can give
us. We just have to shift our way of thinking slightly.

So let's jump in.

Simply put, **template metaprogramming** uses _template instantiation_ to drive
_compile-time evaluation_.

Understanding template metaprogramming begins with having a solid understanding
of templates, so let's take a moment to review how templates work in C++.

### Templates in C++

I can almost guarantee that all of us have used templates in our C++ code.
`std::vector`? `std::map`? These containers come from the STL: the Standard
_Template_ Library. They are type templates that, tell the compiler how to write
the code required to _instantiate_ the type we actually want.

Let's start with a simple example of a template to make crystal-clear the
machinery that drives template metaprogramming:

```cpp
// Define the template
template<class T>
struct Wrapper {
    T value;
};

// Instantiate the template
Wrapper<int> w;
w.value = 42;
```

When we define our template in the example above, the compiler says, "Okay, from
here on out, whenever I see the identifier `Wrapper`, I'm going to use the
template I was given to generate the code I need to make the program well-formed
(i.e. create a valid type)." So when the compiler sees us try to instantiate
`w`, it realizes that `Wrapper<int>` isn't a type, it's a template, so to create
the type the compiler replaces all the occurrences of `T` in our template with
`int` in order to generate a well-formed type:

```cpp
struct WrapperInt {
    int value;
};
```

Notice we didn't write the code for that type ourselves; instead, we told the
compiler how to write it. This lets us create types that can contain and operate
on any other type we need it to without having to manually write all the code
ourselves. For example:

```cpp
int add(int a, int b) {
    return a + b;
}

float add(float a, float b) {
    return a + b;
}

double add(double a, double b) {
    return a + b;
}
```

Now becomes:

```cpp
template<class T>
T add(T a, T b) {
    return a + b;
}
```

### Leveraging Template Instantiation

"But wait a second, if the compiler uses templates to generate code for type and
function definitions, can I write templates that can generate code for values?"

Now there's a thought. :thinking: Let's try it out:

```cpp
// Define our template metafunction
template<int n>
struct Abs {
    static constexpr int value = n > 0 ? n : -n;
};

// Call the template metafunction (yields `12345`)
Abs<-12345>::value;
```

It turns out we can use templates to generate values at compile-time! The above
`Abs` struct is really a **metafunction** that computes the absolute value of an
integer. Normally we would do this at run-time using the `abs` function, but
since we know the input value at compile-time, we can skip the runtime overhead
of computing its absolute value and instead have the compiler compute it and
hard-code it in our binary.

In this way, template metaprogramming basically becomes writing pure functions
using structs.

| Templates            | Metafunctions             |
| :------------------- | :------------------------ |
| Template parameters  | Metafunction parameters   |
| Struct name          | Metafunction name         |
| Static `value` field | Metafunction return value |

_Mapping of template terminology to metafunction terminology_

Translating in our minds the syntax of a template metafunction into something we
are more familiar with, such as a pure function, helps us understand what is
going on and enables us to write increasingly complex metafunctions ourselves as
we build on basics we understand.

## Why is template metaprogramming useful?

As it turns out, the machinery behind template instantiation opens the door for
a suite of pretty slick tricks we can use to write better code.

### Improve flexibility

One use case for template metaprogramming is to tell the compiler how to write
code given types and values that fulfill certain invariants. This allows us to
expose an API to another developer and say "as long as the types you give me fit
the constraints of my API, we will work with your type." This is powerful
because it allows us to expose functionality for types we may not have even
anticipated. This is exactly how the STL works. The C++ standard library doesn't
provide every possible implementation for `std::vector` for every type out
there. Instead, it defines the template and the invariants the types provided to
that template must hold. Then anyone can use the template to create a dynamic
container for contiguous values of any type.

### Improve maintainability

When we first encounter template metaprogramming syntax, we may think it does
anything but make our code more maintainable. However, as we become more
familiar with the syntax, we start to see how we can reuse code in new ways and
enforce certain invariants at compile time so that developers in the future
don't shoot themselves in the foot when adding new functionality.

### Improve runtime performance

"Runtime" is an important qualifier. We don't get a speed-up for free. Rather,
we do work while the program is compiling as opposed to doing it when it is
running. The best-case scenario is we use template metaprogramming to evaluate a
constant expression at compile-time so that in our resulting program the entire
expression is replaced with a hard-coded constant value.

## Fundamentals of Template Metaprogramming

Now that we've taken a moment to explore the _what_ and the _why_ of template
metaprogramming, let's examine the _how_ from a fundamentals perspective. It's
helpful to remember that initially template metaprogramming will be unfamiliar,
which is why it _appears_ to be difficult. However, once we take time to explore
this paradigm with the following fundamentals in mind, we begin to organize more
clearly how it works and can begin to write our own programs using this
technique.

### 1 - Compile Time is Run Time

Everything is constant (functional programming)

Initialize vs. assign (runtime)

### 2 - A Primary Template with Specializations

The machinery is instantiation

Template specializations for metafunction argument pattern matching

Specialzation = pattern matching

(compile-time recursion with specialzation as base)

recursion can be in specialization

constexpr functions vs. metafunctions (which are structs, which have public
member type and data definitions, member declarations, member templates, static
asserts)

### 3 - Types are valid arguments

Can take type as argument (not just value) - can't do with constexpr (type
metafunctions) and produce types

### 4 - SFINAE

Substitution failure is not an error.

Explicit Overload Set Management (metafunction overloading)

Anywhere else in C++ this is illegal: you can't say you don't have an answer

1. Figure out template arguments (verbatim, deduced, or default)
2. Replace each template parameter throughout the template with the argument
3. If well-formed, great...
4. Ill-formed code = not viable due to substitution failure, failed template
   instantiation is silently discarded

Concepts are the future for a lot of SFINAE use cases (i.e. constrained
templates)

## Conventions

`::vlaue` = `std::integral_constant`

`::type` = `type_is`

recursion vs. linear search (head/tail list like in functional programming)

```cpp
template<class T, class... TPack>
struct is_one_of;

template<class T>
struct is_one_of<T> : std::false_type {}

template<class T, class... TPack>
struct is_one_of<T, T, TPack...> : std::true_type {}

template<class T, class U, class...TRest>
struct is_one_of<T, U, TRest...> : is_one_of<T, TRest...> {}
```
