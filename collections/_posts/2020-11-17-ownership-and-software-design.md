---
layout: post
header: default
title: 'Ownership and Software Design'
author: Braden Hitchcock
discord: R94qxZcT4a
---

Clearly communicating the intent of your code is one of the most powerful skills you can acquire in software engineering. It increases productivity, reduces stress, and lowers the entry barrier for new software developers. One aspect of a software application that is oftentimes not communicated clearly is ownership. Ownership, although simple in definition, is a powerful principle that not only solves common problems with memory management and multithreading, but also aids developers in creating well-designed software that is easy to understand&mdash;software that new developers can wrap their heads around quickly.

Most of what has been written about ownership focuses on its benefits when it comes to resource management. There is even a [popular programming language][rust-lang-ownership] built entirely upon the foundation of this principle. Interestingly, not as much is said about the advantages of ownership when it comes to software design. As such, I'd like to focus my thoughts on this specific benefit.

## What is Ownership?

Ownership has a rather simple definition, but to understand it properly it helps to invert the way we think about variables and values in a program. We often think first about (1) creating variables and (2) assigning a value to them; however, ownership makes more sense if we think first about (1) the values in our system and (2) how they are related to variables.

With this inverted way of thinking, we can summarize the principle of ownership as follows: **every value in a program has at least one variable that owns it**.

When we say _own_, we mean that the variable is responsible for the management of the value during the course of its lifetime. When the owning variable goes out of scope or is otherwise removed, the value is discarded, and any allocated resources are freed (heap space, file descriptors, etc.). From a less technical perspective, clearly communicating the ownership of values in a program helps developers understand how to extend, build upon, and maintain the program.

Variables in a program fall into one of three categories when it comes to ownership: sole owner, shared owner, or borrower. To illustrate each category, we will use ownership as it applied to the C++ programming language.

## Sole Owner

In sole ownership, **a value is owned by one and only one variable**. The only way to re-assign a value to another variable is through what is called a _move_. Doing so transfers the responsibility of managing the value to another variable. This is the strictest way to enforce and communicate ownership.

Consider the following function signature that deals with a class representing some real-estate property we can acquire from an agency:

```cpp
struct Property { ... };

struct Agency {
    Property* get_property();
};
```

The signature of `get_property()` raises an important question: who owns the return value? Is it the `Agency`? Or is it the caller of `get_property()`? We could assume that since, in the real world, getting property means you become the owner that the caller now owns the return value of `get_property()`. But assumptions like this are dangerous in programming, and that danger makes it difficult to use the `Agency` class properly. This may not be a problem for the original creators of a software application because they already understand the relationship between `Agency` and the caller, but it introduces a significant entry barrier when onboarding new developers. 

Let's rewrite the function signature of `get_property()` with a special focus on communicating ownership clearly:

```cpp
struct Agency {
    ::std::unique_ptr<Property> get_property();
};
```

Thanks to the [`std::unique_ptr`][unique-ptr], we know that once we call `get_property()`, we become the owners of the resulting value. This clearly defines the relationship of values between `Agency` and the caller.

Communicating sole ownership when creating new objects is even more important. Let's assume we modify `Property` to have a constructor that allows it to have a `Building`:

```cpp
Property(Building* pComputer);
```

We use pointers to take advantage of polymorphism, since there are many different kinds of buildings we can put on our property. However, someone looking at the function signature above encounters the same problem as before. Who owns the `Building` once `Property` is constructed?

Let's refactor it to communicate ownership again:

```cpp
Property(::std::unique_ptr<Building> pComputer);
```

This function signature helps developers understand a lot more about the responsibilities of the `Property` class. It communicates clearly that `Property` _owns_ a `Building`, meaning the `Property` class takes full responsibility for managing the `Building` value assigned to it. This makes sense in the real-world, too. If you remove the property, you would expect everything on it to be removed as well.

## Shared Owner

Shared ownership **allows a single value to be owned by multiple variables**. The variables must use some method of coordination in order to determine who the last owner is, so that when the final owner goes out of scope the value is discarded properly.

Building on our real-estate example, let's say two people go in to buy a piece of property:

```cpp
struct Person {
    Property* _property;

    void purchase_property(Property* property);
}

Person alice;
Person bob;
auto pProperty = new Property{};

alice.purchase_property(pProperty);
bob.purchase_property(pProperty);
```

Based on our understanding thus far, we can recognize the potential difficulties in understanding the relationships between classes using the code above. Who really _owns_ the property? In other words, who is responsible for the `Property` resource management? Technical details aside, these questions make it difficult for someone reading the code to understand the relationships between classes and values, consequentially making it difficult to use the `Property` and `Person` classes.

Since we want to communicate ownership, let's rewrite this using [`std::shared_ptr`][shared-ptr]:

```cpp
struct Person {
    ::std::shared_ptr<Property> _pProperty;

    void purchase_property(::std::shared_ptr<Property> pProperty);
}

Person alice;
Person bob;
auto pProperty = ::std::make_shared<Property>();

alice.purchase_property(pProperty);
bob.purchase_property(pProperty);
```

Now we know exactly how the value of `pProperty` is managed. `std::shared_ptr` will keep track of all the owners and clean up resources when the last one is removed, and it also communicates that both `alice` and `bob` share ownership with the value of `pProperty`.

## Borrower

Borrowers only **reference the value owned by another variable**, which means that they cannot live longer than the value's owner. This duration of life is known as a variable's lifetime. Once the lifetime of a variable ends, any values it owns must be discarded properly.

In our example, let's assume an appraiser comes to inspect the property. The `Appraiser` doesn't own the property, so we can use a reference to communicate that they never own the value of `pProperty`. Using a reference also helps communicate that the `Appraiser` also can't live longer than the `Property` value they are inspecting (which makes sense in the real world, too).

```cpp
struct Appraiser {
    void inspect(const Property& property);
};

auto pProperty = ::std::make_unique<Property>();

Appraiser carol;
carol.inspect(*pProperty);
```

By using a reference here, we properly communicate the relationship between the `Appraiser` and `Property`. We could have passed a reference to `std::unique_ptr` or `std::shared_ptr` as well, but these communicate less clearly the exact relationship (see the appendix below), and if one forgets the ampersand (`&`) indicating the reference, ownership would not be communicated properly.

> Note that C++17 introduces [`std::reference_wrapper`][reference-wrapper], which can be used to indicate the borrower relationship for functors and other objects that want to contain persistent references to other values rather than pointers.

## Communicating Ownership Produces Well-designed Software

Ownership, although an often overlooked principle, is fundamental to well-written software. Communicating ownership properly helps us get the most out of agile software development, and although external documentation is important, using code as documentation is the fastest and most stress-free way of helping other developers understand the design of the system.

## Appendix: C++ Ownership Reference

The following information is helpful when deciding how to communicate ownership for a value of type `T`.

| Type                        | Description                                                                            |
| :-------------------------- | :------------------------------------------------------------------------------------- |
| `std::unique_ptr<T>`        | The variable is the sole owner.                                                        |
| `std::unique_ptr<T>&`       | The borrower needs to modify the `std::unique_ptr` itself, not the value it points to. |
| `const std::unique_ptr<T>&` | The borrower needs access to information about the `std::unique_ptr`.                  |
| `std::shared_ptr<T>`        | The variable is one of many owners (shared ownership).                                 |
| `std::shared_ptr<T>&`       | The borrower needs to modify the `std::shared_ptr` itself, not the value it points to. |
| `const std::shared_ptr<T>&` | The borrower needs access to information about the `std::shared_ptr`.                  |
| `T`                         | The owner is the sole owner of a new value.                                            |
| `T&`                        | The borrower needs to modify the value.                                                |
| `const T&`                  | The borrower needs information about the value, but doesn't need to modify it.         |

_Table 1: Communicating ownership with types in C++_

Additional information about some common practices for communicating ownership can be found in the [C++ Core Guidelines][c++-core-guidelines].

[rust-lang-ownership]: https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html
[unique-ptr]: https://en.cppreference.com/w/cpp/memory/unique_ptr
[shared-ptr]: https://en.cppreference.com/w/cpp/memory/shared_ptr
[reference-wrapper]: https://en.cppreference.com/w/cpp/utility/functional/reference_wrapper
[c++-core-guidelines]: http://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#S-resource
