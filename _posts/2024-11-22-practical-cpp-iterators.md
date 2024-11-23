---
layout: post
header: default
title: "Practical C++20 Iterators In-depth"
author: Braden Hitchcock
---

I've found it surprisingly difficult to locate a good summary on modern C++
iterators, so I took some of my spare time to try and provide one complete with
some simple examples. I hope you find it useful!

> Complete code examples that you can actually compile can be found on the
> [GitHub gist associated with this post].

## What is an Iterator?

Simply put: An iterator points to the location of a single element within a
larger collection.

Verbosely put: it abstracts away a set of cursor-like information into a highly
cohesive object that can be used to traverse a collection and access its
elements.

The iterator abstraction (in any language) allows us to write algorithms that
can operate on a collection as long as that collection satisfies certain
properties. Things like sorting, finding a maximum value, and reducing are
easier to implement generically when they use iterators.

## Traditional C++ Iterators

[Iterators] have been around since before C++11 (what we might call "modern
C++"), but they really hit mainstream after C++11 came out. While the Standard
Template Library (STL) containers all implement their own iterators, it is
possible for developers to create iterators for custom collections.

The typical way of doing this in the past was by [tagging].

With tagging, you define some types with specific names for your custom
iterator, then the STL would perform some compile-time checks to read these
types and determine whether or not your custom iterator satisfied all the
requirements of the algorithm.

For example, an iterator over a custom array-like sequence of elements might
have tags that look something like this:

```cpp
#include <iterator>

template <class T>
struct Iterator {
    using iterator_category = std::forward_iterator_tag;
    using value_type = T;
    using difference_type = std::ptrdiff_t;
    using pointer = T*;
    using reference = T&;

    // ...rest of iterator implementation here
};
```

Then, algorithms in the STL would make sure the type of `iterator_category` was
a tag that supported their operations. For example, [`std::sort`] would check
for `std::random_access_iterator_tag`.

## Modern C++ Iterators

While tagging still works, it puts extra requirements on the developer.

You have to remember the five type names above and use the proper tag for your
iterator. You also have to make sure that you implement the correct methods on
your iterator type for that tag.

If you don't, the compiler errors you get are not always intuitive.

If you know, you know 🙃

C++20 introduced [constraints and concepts] (often referred to simply as
_concepts_). Thanks to concepts, we can now implement iterators based on their
_behavior_ rather than their _identity_. This is often referred to as "duck
typing": if it looks like a duck and quacks like a duck, then it's a duck.

With this new feature you can to use the `concept` keyword to define the
requirements a template parameter must satisfy.

Fortunately, we don't have to try and define the iterator concepts ourselves.
The STL ships with the following fundamental concepts for iterators:

- [`std::input_iterator`]
- [`std::output_iterator`]
- [`std::bidirectional_iterator`]
- [`std::forward_iterator`]
- [`std::random_access_iterator`]
- [`std::contiguous_iterator`]

But before we get into the details on each of these types of iterators, it's
important to cover one other key update C++20 introduces for iterators: the
[`std::sentinel_for`] concept.

### Sentinel Values

Sentinel values are used to signal the end of a sequence or iteration.

Prior to C++20, the way a program checked to see if you hit the end of a
collection was to compare your current iterator with an "end" iterator _of the
same type_. Usually this end iterator was just a special case of your normal
iterator that had some internal state identifying it as the end.

Starting in C++20, you can actually use _any type_ as a sentinel for an iterator
so long as that type satisfies the `std::sentinel_for` concept. This concept
requires that the sentinel type only be comparable to your custom iterator type.
This means you could do something like the following where your iterator can be
compared against an empty type:

```cpp
struct Iterator {
    // ...implementation details here
};

struct Sentinel {};

bool operator==(Iterator it, Sentinel s) {
    // return whether `it` is at the end
}
```

This let's us implement custom methods on our `Iterator` type so we can query
whether the iterator is at the end, rather than having to compare it with
another iterator of the same type.

It's a subtle distinction, but it does overcome some of the limitations of a
simple boolean comparison of two iterators of the same type.

For some modern C++ iterators, you only need to implement an equality check
against a sentinel, but for most you still need to implement equality against
the iterator type itself. This is because many of the iterators are still
expected to be sentinels for themselves, thus maintaining backwards
compatibility with versions of C++ prior to the 2020 edition.

Now on to some examples of duck-typed iterators in C++20! 😁

### Output Iterators

Output iterators are unique in that you can only _write_ to them. This means you
can only dereference this type of iterator on the left-hand side of an
assignment, then increment it, and move on.

Since they are single-pass, you don't even need to implement an equality
operator on an output iterator because it doesn't have an end iterator or
sentinel value to compare against anyways.

Here's an example of an output iterator that writes to an in-memory vector that
grows indefinitely.

```cpp
template <class T>
class OutputIterator {
    public:
    using difference_type = std::ptrdiff_t;     // 1

    T& operator*() {                            // 2
        return _buf.back();
    }

    OutputIterator& operator++() {              // 3
        _buf.emplace_back();
        return *this;
    }

    OutputIterator operator++(int) {            // 4
        auto prev = *this;
        ++*this;
        return prev;
    }

    private:
    std::vector<T> _buf;
};
```

With modern iterators, the only type we need to tag is the type of the value
that represents the difference between two elements in the collection (**1**).

Then we just define the operations that satisfy the constraints in the
[`std::output_iterator`] concept.

At **2** we define the dereference operator, which must return a mutable
reference to the next element in the "buffer". Then at **3** and **4** we define
the pre and post-increment operators that advance to the next element.

### Input Iterators

Like output iterators, input iterators wrap a resource or collection. Unlike (or
rather opposite to) output iterators, input iterators support the _read_
operation.

Input iterators are also single-pass, but because they are expected to consume a
finite number of values they must be comparable to some sentinel value. The
interesting thing here is that type of this value doesn't come into play until
you pass the iterator to an algorithm.

In other words, an equality comparison operator is not required in the
definition of a class in order for it to satisfy the `std::input_iterator`
concept.

With that in mind, the following example demonstrates the interface of an input
iterator that wraps an in-memory buffer:

```cpp
template <class T>
class InputIterator {
    public:
    using difference_type = std::ptrdiff_t;     // 1
    using value_type = T;                       // 2

    InputIterator(std::vector<T> buf)
        : _buf{std::move(buf)} {}

    T& operator*() const {                      // 3
        return _buf[_idx];
    }

    InputIterator& operator++() {               // 4
        ++_idx;
        return *this;
    }

    void operator++(int) {                      // 5
        ++*this;
    }

    private:
    std::vector<T> _buf;
    std::size_t _idx{0};
};
```

We still have to tag the type that represents the difference between two
iterator (**1**), but now we also have to tag the type of the value the input
iterator will produce (**2**). This helps algorithms do proper type-checking
against template parameters, particularly in searches and assignments.

Like the output iterator, we also define a dereference operator (**3**) and a
pre-increment operator (**4**). We define a post-increment operator as well
(**5**), but notice how in this example its return type is `void` rather than a
copy of an iterator.

We could have defined the post-increment operator to return `InputIterator`, but
there is a reason we may not want to do this.

If you want to invalidate old iterators once they are advanced, then you should
use the `void` return type to prevent users from accidentally holding on to
iterators they shouldn't. Imagine trying to hold on to an old iterator that
points to some buffered memory you were reading from, but that buffered memory
has been cleaned up since then.

Cue undefined behavior!

To prevent this, you can optionally define the the post-increment operator to
only advance the iterator and not return a copy to the previous iterator.

### Forward Iterators

Output and input iterators are special cases of iterators. They only produce or
consume values. The majority of the time what we really want to do is visit all
the elements of a collection.

This is where the remainder of the standard library iterator concepts come in.

The first iterator we are going to cover is forward iterator, represented by the
[`std::forward_iterator`] concept.

Forward iterators, as the name implies, only advance in one direction: forward.
You can't decrement a forward iterator, and you can't perform arithmetic
operations on it.

The following snippet shows a complete example of a forward iterator that allows
us to access the elements of a vector.

> Yes, `std::vector` has its own iterator type, but bear with me here 😃

```cpp
template <class T>
class ForwardIterator {
    public:
    using difference_type = std::ptrdiff_t;
    using value_type = T;

    ForwardIterator() = default;

    ForwardIterator(std::vector<T>& elements)
        : _v{&elements} {}

    T& operator*() const {
        return (*_v)[_idx];
    }

    ForwardIterator& operator++() {
        ++_idx;
        return *this;
    }

    ForwardIterator operator++(int) {                       // 1
        auto prev = *this;
        ++*this;
        return prev;
    }

    bool operator==(const ForwardIterator& other) const {   // 2
        return _v == other._v && _idx == other._idx;
    }

    private:
    std::vector<T>* _v{nullptr};
    std::size_t _idx{0};
};
```

You may have noticed that a forward iterator looks an awful lot like an input
iterator. If so, you are correct. The only differences are at **1** and **2**.

At **1**, the post-increment operator must return a copy of the previous
iterator. At **2**, we define an equality comparison operator against the
forward iterator. This is for backwards compatibility and allows the iterator to
be used in the traditional STL algorithms that need to know whether they are at
the end of the collection.

> NOTE: Newer STL algorithms that uses sentinels instead of end iterators are
> part of the `std::ranges` library. This will be a topic of discussion in a
> future post 🙃

### Bidirectional Iterators

Imagine you are attempting to traverse a doubly linked list. This should support
both moving to the next node in the list (forward) and also moving to the
previous node (backward). When we want to be able to move forward and backwards
across our collection, we use the [`std::bidirectional_iterator`].

```cpp
template <class T>
class BidirIterator {
    public:
    // --snip-- ... same as ForwardIterator

    BidirIterator& operator--() {
        --_idx;
        return *this;
    }

    BidirIterator operator--(int) {     // 1
        auto prev = *this;
        --*this;
        return prev;
    }

    private:
    std::vector<T>* _v{nullptr};
    std::size_t _idx{0};
};
```

This iterator is very similar to a forward iterator. The only difference is the
addition of the decrement operator (**1**). You must provide both pre and
post-decrement operators in order to satisfy this concept.

### Random Access Iterators

So we can move forward and backwards, but what if I want to use my iterator to
jump around my collection by arbitrarily sized steps? This is especially useful
for many sorting algorithms.

Enter the [`std::random_access_iterator`].

This iterator supports arithmetic operations for the addition and subtraction of
a distance between two iterators.

Here is an example that builds on top of the `BidirIterator` we saw in the
previous section.

```cpp
template <class T>
class RandAccIterator {
    public:
    // --snip-- ... same as BidirIterator

    RandAccIterator& operator+=(difference_type n) {
        _idx += n;
        return *this;
    }

    RandAccIterator operator+(difference_type n) const {
        auto next = *this;
        next += n;
        return next;
    }

    RandAccIterator& operator-=(difference_type n) {
        _idx -= n;
        return *this;
    }

    RandAccIterator operator-(difference_type n) const {
        auto next = *this;
        next -= n;
        return *this;
    }

    difference_type operator-(const RandAccIterator& other) const {
        return _idx - other._idx;
    }

    T& operator[](difference_type n) const {
        return _v[_idx + n];
    }

    bool operator<(const RandAccIterator& other) const {
        return _idx < other._idx;
    }

    bool operator<=(const RandAccIterator& other) const {
        return !(other > *this);
    }

    bool operator>(const RandAccIterator& other) const {
        return other < *this;
    }

    bool operator>=(const RandAccIterator& other) const {
        return !(*this < other);
    }

    private:
    std::vector<T>* _v{nullptr};
    std::size_t _idx{0};
};

template <class T>
using DiffType = std::iter_difference_t<RandAccIterator<T>>;

template <class T>
RandAccIterator<T> operator+(
    const DiffType<T>& n,
    const RandAccIterator<T>& i
) {
    return i + n;
}
```

Wow...okay, that was a lot of additional work 😮‍💨

Random access iterators are more powerful, but as with anything in software that
is more powerful, it often means more complexity. The code above is the bare
minimum that you must have in order for your iterator to satisfy the
`std::random_access_iterator` concept.

In summary, you need to add the arithmetic operators for addition and
subtraction as well as ordered comparison operators for sorting.

Hopefully seeing it all in one place helps if you ever need to implement your
own random access iterator over a custom collection!

### Contiguous Iterators

The final iterator type supported by the standard library is modeled by the
[`std::contiguous_iterator`] concept. This iterator does everything a random
access iterator does but has an additional guarantee.

The collection stores its elements contiguously in memory.

Containers like vectors and arrays are considered contiguous. If you had a
custom contiguous type like a stack, heap, or ring buffer built on top of an
array or vector, then you would be able to use a contiguous iterator with it as
well.

The purpose of the contiguous iterator is to allow for optimizations in
algorithm implementations. Because guaranteeing this is extremely difficult to
do with duck typing, this is the one exception where we should rely on tagging
for help.

```cpp
template <class T>
class ContiguousIterator {
    public:
    // --snip-- ... same as RandAccIterator

    using iterator_concept = std::contiguous_iterator_tag;      // 1

    T* operator->() const {                                     // 2
        return _v->data();
    }
};
```

Note at **1** we've added a type definition for `iterator_concept` and
explicitly set it to `std::contiguous_iterator_tag`. Without this tag the
compiler can't determine whether or not the iterator operates on contiguous
values.

We also need to add the arrow operator (**2**). It's interesting to note that we
haven't needed this for any of our other iterator types. We need it here because
the compiler is essentially making the assumption that if your values are stored
contiguously, then it should be able to use a pointer to a value in your
collection as a type of iterator as well.

Even though it isn't required for the other iterator types, I recommend you add
it to your custom iterators. Doing so will make the API more complete and feel
more natural to developers who are already familiar with iterators.

## Final Thoughts

You survive the fire hose! 🔥

I hope that this summary of modern C++ iterators helps you implement custom
collections that can take advantage of the many powerful standard library
algorithms that use iterators. Your fellow developers, and your future self,
will thank you later for doing so.

Keep Coding Strong!

<!-- prettier-ignore-start -->

[GitHub gist associated with this post]: https://gist.github.com/bradenhc/10ffe3598d8bf0e640808164acfa41b6
[ranges]: https://en.cppreference.com/w/cpp/ranges
[Iterators]: https://en.cppreference.com/w/cpp/iterator
[tagging]: https://en.cppreference.com/w/cpp/iterator/iterator_tags
[`std::sort`]: https://en.cppreference.com/w/cpp/algorithm/sort
[constraints and concepts]: https://en.cppreference.com/w/cpp/language/constraints
[`std::sentinel_for`]: https://en.cppreference.com/w/cpp/iterator/sentinel_for
[`std::input_iterator`]: https://en.cppreference.com/w/cpp/iterator/input_iterator
[`std::output_iterator`]: https://en.cppreference.com/w/cpp/iterator/output_iterator
[`std::forward_iterator`]: https://en.cppreference.com/w/cpp/iterator/forward_iterator
[`std::bidirectional_iterator`]: https://en.cppreference.com/w/cpp/iterator/bidirectional_iterator
[`std::random_access_iterator`]: https://en.cppreference.com/w/cpp/iterator/random_access_iterator
[`std::contiguous_iterator`]: https://en.cppreference.com/w/cpp/iterator/contiguous_iterator

<!-- prettier-ignore-end -->
