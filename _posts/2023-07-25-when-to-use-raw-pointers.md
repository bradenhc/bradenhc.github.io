---
layout: post
header: default
title: "When to Use Raw Pointers"
author: Braden Hitchcock
tags: ["C++", "Ownership", "Memory Management", "Maintainability"]
comments: https://discordapp.com/channels/904059090358140938/904696336933339156/1279425073962553355
---

I work a lot with legacy C/C++ code. Much of it is written in a pre-C++11 style,
and even when C++11 features are used, they aren't used as effectively as they
could be.

These experiences have brought me face-to-face with raw pointers in the wild on
an almost daily basis. In C++20 and beyond we tend to frown upon raw pointers
because they don't clearly communicate resource ownership, making it more
difficult to guarantee memory safety. Instead, we prefer smart pointer types
like [`std::unique_ptr`][uptr] and [`std::shared_ptr`][sptr] because they
clearly communicate how the memory is managed.

However, it's nearly impossible to work on any relatively mature C++ project
without encountering raw pointers. Sometimes new projects will even need to dip
down and use raw pointers.

Don't get me wrong. I'm not saying that raw pointers are absolutely evil. In
fact, I'm not one to believe entirely in absolute statements like "You should
_never_ use raw pointers." They have utility, so the question remains: when
should we use raw pointers in C++?

## Raw Pointer Objectives

Typically when I see a raw pointer, it's evident that the original programmer
used it to accomplish one of the following objectives:

1. Enable dynamic polymorphism.
2. Store large data on the heap.
3. Store dynamically allocated contiguous sequences.
4. Borrow a value.

All of these objectives have valid use cases, but there are modern alternatives
that we can reach for to make our code cleaner, more maintainable, and more
predictable. Let's take a look at each of the objectives and how I've seen raw
pointers used to accomplish them. After we look at some explanations and
examples, we'll cover how each of the objectives can be achieved using more
modern programming techniques.

### Enabling Dynamic Polymorphism

This usage of raw pointers is the most common when the original objective was
clearly some form of [Object Oriented Programming][oop]. Many times the abstract
type is the base-level interface type, made up almost completely of pure virtual
functions, and the concrete type is constructed based on some configuration
provided to the application on startup for a particular implementation.

This is still a very common (and useful) reason to reach for pointers.
[Polymorphism][poly] is a powerful programming tool, and we shouldn't avoid it
just because it may require pointers from time-to-time. However, a more modern
approach would be to use a smart pointer to more clearly communicate ownership.
We can even use references when we just need to borrow the concrete
implementation instance.

The follow code provides a simple example of what it looks like to use smart
pointers vs. raw pointers for polymorphism.

```cpp
// Our interface
class Writer {}

// The implementations
class FileWriter : public Writer {}
class SocketWriter : public Writer {}

// Polymorphism - the old way (sole owner, shared owner, and borrower)
Writer* w = new SocketWriter();         // 1

// Polymorphism - the modern way (sole owner and shared owner)
std::unique_ptr<Writer> w = std::make_unique<SocketWriter>();   // 2
std::shared_ptr<Writer> w = std::make_shared<FileWriter>();     // 3

// Polymorphism - the modern way (borrow)
FileWriter fw;
Writer& w = fw;         // 4
```

Notice how the usage of a raw pointer at **1** introduces confusion and memory
issues. Who should call `delete` on the writer? If we pass it to a function,
does ownership transfer? Or is the function or class we pass our pointer to
merely bower the writer?

Now see how these issues are resolved by using the smart pointers at **2** and
**3**. When we see [`std::unique_ptr`][uptr], we know that there can only ever
be one owner, and whoever has the unique pointer instance is that owner. The
memory also gets cleaned up automatically when the unique pointer is destroyed.
Likewise, when we see [`std::shared_ptr`][sptr], we know that there are multiple
owners of the value, and the value is guaranteed to be valid until the last
owner goes out of scoped. Only then is the shared pointer destroyed.

In C++ we can also use references to access polymorphic types as in **4**. This
communicates strongly that we are only borrowing the value, and that the value
must outlive our reference to it.

We'll talk a little bit more about ownership and borrowing values in a later
section. For now, know that it is important to maintain clarity on value
ownership. The more clearly we communicate in our code who owns values, the
easier it is to reason about and maintain.

### Storing Large Data on the Heap

Using pointers in this way is also extremely common. Usually I encounter this in
the form of a pseudo-singleton database instance or when there is a large
collection of static configuration properties that need to be used by multiple
classes.

Like dynamic polymorphism, there is nothing wrong with this objective. Using the
heap is the recommended approach in this instance to avoid copying large
structures around on the stack, which can decrease performance. However, also
like dynamic polymorphism, the more modern way to store data on the heap is to
use smart pointers because they clearly communicate ownership.

```cpp
class LargeData {}

std::unique_ptr<LargeData> data = std::make_unique<LargeData>();
```

> **Ownership** <br/> You may have noticed I'm talking _a lot_ about ownership.
> It's intentional 🙂 Ownership in system-level programming languages is
> extremely important. Without clear ownership, it is extremely difficult to
> maintain a program and reason about its design. Not to mention a lack of clear
> ownership also invariably introduces memory safety issues, which leads to
> security vulnerabilities.

### Store Dynamically Allocated Contiguous Sequences

Now this is an interesting one, and it is certainly a C-style approach to
solving the problem. What I usually encounter in this instance is a structure
like the following (I'm actually lucky if it is a structure and not two separate
global variables in many cases).

```cpp
struct Collection {
    int* data;
    int size;
};
```

When `data` is allocated by some external initialization function, it's
allocated as a large contiguous block in a manner similar to the following:

```cpp
Collection c;
c.data = new int[1000];
c.size = 0;
```

Then the elements are referenced just like you would any other array, only the
size is also updated inline with the assignment:

```cpp
c[c.size++] = 1;
c[c.size++] = 2;
c[c.size++] = 3;
```

You may have noticed that this essentially creates a vector with a capacity of
1000 integer elements. It looks confusing, and that's because it's written in a
C-style before C++ facilities made encapsulation even easier. It's also
dangerous. What if you forget to free the memory later in your code? What if you
try to add more than 1000 elements? Guaranteeing safety in these cases leads to
scattered `if/else` statements checking invariants and attempting to keep your
program safe.

In modern C++, we would just use the [`std::vector`][vec] type directly (or one
of the other list-like containers from the Standard Template Library), which
encapsulates the memory allocation inside the vector class for us and gives us
safer access to the container. Even if we absolutely needed our own custom
class, it would be better to use a pattern called Resource Acquisition is
Initialization ([RAII][raii]) and encapsulate the low-level memory details
behind a class interface like the following:

```cpp
class Collection {
    public:
    Collection()
        : _data{std::make_unique<int[]>(1000)}, _size{0} {}     // 1

    void push_back(int val) {
        if (_size == 1000) {
            throw std::runtime_error("collection full");        // 2
        }
        _data[_size++] = val;
    }

    private:
    std::unique_ptr<int[]> _data;                               // 3
    int _size;
};

Collection c;
c.push_back(1);
c.push_back(2);
c.push_back(3);
```

At **1**, we allocate the memory we need and set the initial size in
construction. This is our RAII approach to the structure. We also improve memory
safety at **2** by encapsulating the check to make sure we don't assign a value
beyond the bounds of our collection.

We've also eliminated the raw pointer at **3**. By using a smart pointer, we
guarantee that the memory is freed on destruction without any additional
programming on our part.

It's almost inevitable that the C-style implementation above exists somewhere in
a legacy codebase if you are working on one, so it's important to recognize how
it is being used and what refactoring can be done to improve its
maintainability.

### Borrow a Value

This raw pointer use case is often the culprit in confusing legacy designs. This
isn't because the use case is complex; rather, it's because using raw pointers
to borrow values makes determining resource ownership a nightmare unless there
are conventions in place governing raw pointer usage.

So let's take a step back and examine this objective.

When we say _borrow a value_, what we mean is that we want to use the value
inside a variable somewhere in our program (like in a function), but that
location isn't directly responsible for managing the lifecycle of the value. For
example, we may have a large data structure allocated on the heap that we want
to pass to a function as an argument. The function isn't responsible for
cleaning up the memory when it's done. It's just needs to use the value.

This is a classic example of borrowing values in code. In order to borrow the
value, typically what you need is a _reference_ to the variable holding the
value. The code borrowing the value can then just look at the reference. This is
effectively the same amount of overhead as copying the value's address (a
pointer), so it's must faster than copying values around everywhere.

C++ provides references, but in my experience they are underused. The following
code snippet demonstrates how I've seen raw pointers used as a means of
borrowing values.

```cpp
class Connection {}

class MessageWriter {
    public:
    MessageWriter(Connection* c) : _conn{c} {}

    private:
    Connection* _conn;
};

class MessageReader {
    public:
    MessageReader(Connection* c) : _conn{c} {}

    private:
    Connection* _conn;
};

Connection c = new Connection();
MessageWriter w = new MessageWriter(c);
MessageReader r = new MessageReader(c);
```

In this example, we have a `MessageWriter` and `MessageReader` that both want to
borrow a connection to some external resource. They may be borrowing the
connection to reuse it so that every instance doesn't need to create its own
connection, thus reducing resource consumption. In order to borrow the
`Connection`, the programmer elected to store the borrowed value as a raw
pointer.

While the intentions may have been clear to the original author, imagine coming
in to the codebase just a few months or a year later after the code has evolved
and trying to understand what is happening. Also imagine the code is poorly
documented and there is insufficient design documentation to help you understand
what's going on in the code.

You can imagine how frustrating it would be to be in that situation!

Once again, we can alleviate these pain-points by using smart pointers and/or
references. In this case, we will use a reference to indicate that we are merely
borrowing the reference, not taking or sharing ownership of it:

```cpp
class MessageWriter {
    public:
    MessageWriter(Connection& c) : _conn{c} {}      // 1

    private:
    Connection& _conn;      // 2
};

Connection c;
MessageWriter writer{c};
```

Notice how the only changes we make are to the constructor at **1** and to the
stored type at **2**. All we've done is change an asterisk to an ampersand, but
by doing so we have made our code clearer. This subtle change, along with some
good documentation, will make our intentions clear and help the code evolve
safely.

> **Why not use a shared pointer?** <br/> In this case I wanted to demonstrate
> the use of a reference to communicating a "borrows" relationship. A shared
> pointer would have also worked, and making the call between a shared pointer
> and a reference is a design decision with tradeoffs. I tend to prefer
> references over shared pointers because abusing shared pointers is too easy
> and can make the program just as confusing as if we were using raw pointers.

## So When Can I Use Raw Pointers?

You may have noticed that I've eliminated the need for raw pointers in every
objective above. So what's left? Are there any use cases for raw pointers?

As a matter of fact there are, but they constitute rare exceptions to general
ownership rules rather than normal patterns. Let's look at the most common
reasons I personally use raw pointers and how we can use them but still keep our
program clean, memory safe, and maintainable.

### Deferring Borrowed Value Initialization

This is probably the most common reason I use raw pointers. Sometimes I have a
class member that may not need to be initialized on object construction. In
fact, the presence of a borrowed value may change the class behavior.

In the following example we have a view of some hierarchal key/value storage
container. I've developed such a container for managing application
configuration in the past, and using raw pointers for storing the view contents
has kept the implementation simple.

```cpp
// Our hierarchical key/value container
class PropertyTree {}

// A wrapper around the container for ergonomic access
class Config {
    public:
    // Access a sub-view of the configuration. Return a valid
    // view only if a subtree exists at the provided key.
    ConfigView view(const std::string_view key) {
        if (std::optional<PropertyTree> t = _props.get(key)) {
            return ConfigView{*t};                  // 1
        } else {
            return ConfigView{};                    // 2
        }
    }

    private:
    PropertyTree _props;
};

// A view of an existing `Config` instance
class ConfigView {
    public:
    ConfigView() = default;

    explicit operator bool() const noexcept {       // 3
        return _props != nullptr;
    }

    private:
    PropertyTree* _props{nullptr};

    // Private so that a valid view can only be constructed
    // using a call to `Config::view()`
    ConfigView(PropertyTree& props) : _props{&props} {}
};

// Example usage
Config c;
ConfigView v = c.view("a.b.c");                     // 4
if (v) {
    // Got a valid view
}
```

Inside the `Config::view()` function, we have two branches. If a subtree in our
`PropertyTree` exists at the provided `key`, then we create a new `ConfigView`
instance that borrows that subtree so the user can access it directly (**1**).
If a subtree at the key doesn't exist, then we provide a default-constructed
`ConfigView` instance, which has no borrowed properties (i.e. the `_props`
member variable has a value of `nullptr`) (**2**). We can test whether a view is
valid using the explicit boolean conversion operator (**3**), an example of
which can be seen at **4**.

There are likely other ways to implement this kind of behavior, but this
approach makes the most sense to me. However, I always ensure I encapsulate the
raw pointer usage inside of a class so that the usage is hidden from the user. I
also clearly document the class code so that anyone reading the definition knows
that the raw pointer indicates a borrowed value and should not be deleted.

### Interacting with Low-level or Standard Library Facilities

I recently came across a situation where I needed to implement some custom
[`std::istream`][istream] and [`std::ostream`][ostream] instances. If you look
at the documentation of the `std::istream` and `std::ostream` constructors, both
take a raw pointer to a [`std::streambuf`][streambuf] implementation that
handles all the I/O and buffering.

In situations where an interface requires that I use a raw pointer, I usually
try to get around it by turning to `std::unique_ptr` and calling `get()` on the
unique pointer instance, which returns the managed pointer.

```cpp
class CustomBuffer : public std::streambuf {}

class CustomStream : public std::istream {
    public:
    CustomStream()
        : std::istream{nullptr},
        _buf{std::make_unique<CustomBuffer>()} {
        rdbuf(_buf.get());
    }

    private:
    std::unique_ptr<CustomBuffer> _buf;
}
```

Using a smart pointer allows me to leverage existing types to manage my memory
for me. It also means I write less code, which means fewer bugs (usually). That
said, I could have easily just used a `new` in the constructor to create the
buffer. I would just need to remember to add a `delete` statement in the
destructor to clean up the buffer when the stream is destroyed.

## Use Pointers Responsibly

There is ultimately no way to completely avoid using raw pointers in our code,
but hopefully now you have a few tools up your sleeve that will help maintain
clarity about resource ownership and provide an enjoyable experience to your
fellow software developers. Remember:

- Use [`std::unique_ptr`][uptr] and references liberally.
- Reach for [`std::shared_ptr`][sptr] only when you can't avoid multiple owners.
- Encapsulate your raw pointers to hide them from the rest of your code.
- Provide clear documentation on lifetimes and ownership to help remind future
  maintainers (including yourself) why you used a raw pointer instead of another
  type.
- Establish and document raw-pointer usage conventions in your organization.

Do all that, and you'll be well on your way to writing maintainable, memory safe
programs in C++ 😁.

Happy coding!

<!-- prettier-ignore-start -->
[oop]: https://en.wikipedia.org/wiki/Object-oriented_programming
[isocpp-refs]: https://isocpp.org/wiki/faq/references#pointers-and-references
[isocpp-refs-vs-ptrs]: https://isocpp.org/wiki/faq/references#refs-vs-ptrs
[poly]: https://en.wikipedia.org/wiki/Polymorphism_(computer_science)
[raii]: https://en.cppreference.com/w/cpp/language/raii
[uptr]: https://en.cppreference.com/w/cpp/memory/unique_ptr
[sptr]: https://en.cppreference.com/w/cpp/memory/shared_ptr
[vec]: https://en.cppreference.com/w/cpp/container/vector
[istream]: https://en.cppreference.com/w/cpp/io/basic_istream
[ostream]: https://en.cppreference.com/w/cpp/io/basic_ostream
[streambuf]: https://en.cppreference.com/w/cpp/io/basic_streambuf
<!-- prettier-ignore-end -->
