---
layout: post
header: default
title: "<code>inline</code> vs. <code>static</code> Functions in C++"
author: Braden Hitchcock
---

A teammate recently posed a thought-provoking question during some C++ training.
We were discussing when it is appropriate to use the `static` keyword for
function definitions, since we have other modern C++ approaches that can
accomplish much of the same thing.

During this discussion my coworker asked the following question:

"So what happens when the compiler decides not to inline a function marked as
`inline`?"

At the time, I reasoned that when the compiler chose not to inline a function
call that the function became `static`. But the truth was I wasn't certain, so I
decided to dive deeper to discover what really happens :slightly_smiling_face:

## The Linker and Symbol Bindings

Before we get started in answering this question, we need to look at a basic
step in the compilation process: linking.

During compilation, entities in text-based code (functions, variables, and
types) are turned into machine code and stored in object files. Every object
file represents a single translation unit. The entities that the compiler put in
these translation units are identified using a deterministic symbol name. The
job of the linker is to comb though multiple translation units that are about to
be merged into the same executable and decide which symbols refer to the same
entity.

Multiple translation units may contain the same symbol, and each symbol could
have a corresponding entity in one or more translation units. This
correspondence between a symbol and its entity is called the symbol definition.
Since every symbol must have a definition in an executable&mdash;or be tied to
an entity&mdash;the linker is responsible for making sure that definitions exist
for all symbols used in an executable, and that two definitions don't collide.

There are two types of symbols the linker considers during the resolution
process: _strong_ and _weak_. Each type of symbol can also be defined in one of
two scopes: _local_ or _global_. As the linker encounters symbols, it follows
three basic rules using these types.

- There can only be one _strong global_ symbol definition (One Definition Rule),
  but multiple _strong local_ definitions may exist
- A _strong_ symbol definition of the same name as a _weak_ symbol definition
  will override the _weak_ symbol.
- If there are only _weak_ symbol definitions, then the one with the largest
  binary size is chosen

These rules will play an important part in the rest of our investigation.

## `static` Functions

When a function is declared `static`, the compiler creates a _strong local_
symbol for it. Every translation unit gets its own copy of the function. Since
every unit gets its own copy, each unit can use the same symbol to refer to that
function and the linker knows that the symbol is _local_. It doesn't do anything
to try and consolidate it.

## `inline` Functions

When a function is declared `inline`, the compiler does one of two things.

First, it decides whether or not it is going to inline the function. Inlining is
essentially a copy-paste of the function body where it would normally have been
invoked. This avoids a jump instruction, making the code more efficient.

<!-- prettier-ignore -->
Second, if the compiler decides not to inline the function, it creates a
_weak global_ symbol for it. Every translation unit where the inlined function 
is used will get its own definition of the function.

But this is where things get interesting!

Because `inline` functions that are not inlined are referenced by a _global_
symbol, the linker is free to consolidate the definitions across translation
units. Furthermore, since the symbol definitions are _weak_, the linker won't
report an error when it encounters multiple definitions of that symbol. Instead,
it picks the definition with the largest binary size to use in the final
executable. This results in a single definition shared across all translation
units that get linked into the final executable.

## What about `static inline` and `inline static`?

Put simply, `static` is stronger and overrides the ODR behavior of `inline`.

Every translation unit will get one copy, just like when a function is declared
using only `static`. At this point, `inline` is a hint to the compiler that it
_could_ inline the function call, but if it doesn't, then every translation unit
will still end up with its own copy.

## Which should I use?

This is where we start to get subjective :slightly_smiling_face: And software
design plays an important role here as well.

My personal preference is to avoid static non-member functions wherever
possible. Most of the time when I need a single definition of a non-member
function in a translation unit, it is because that function is a private
implementation of some public interface that is defined in that translation
unit. In this case, I use an anonymous namespace inside the source file (not the
header) instead of `static`. This modern alternative accomplishes the same
thing, and it also lets me define other entities that are scoped local to that
private implementation, such as types.

Also, using `inline` instead of `static` results in a smaller overall executable
size, which makes a lot of sense especially when every usage of that function is
expected to behave in exactly the same way.

We may ask, "But what if we need every translation unit to get its own copy of a
function because that function has some local static state that needs to be
preserved across translation units?"

My answer: this type of approach is an anti-pattern and should be avoided. The
pitfalls associated with maintaining this kind of code organization far outweigh
the benefits, and there are other design alternatives that leverage sounder
object-oriented principles and result in much more maintainable code.

## Let's Recap

A `static` function results in a _strong local_ symbol, so every translation
unit is guaranteed to get its own definition.

An `inline` function results in a _weak global_ symbol, so all definitions
across every translation unit in an executable are consolidated into a single
definition by the linker if the function is not inlined by the compiler.



<!-- prettier-ignore-start -->
[1]: https://stackoverflow.com/questions/22102919/static-vs-inline-for-functions-implemented-in-header-files
[2]: https://stackoverflow.com/questions/12836171/difference-between-an-inline-function-and-static-inline-function/12836392#12836392
[3]: https://unix.stackexchange.com/questions/478795/why-do-some-libc-symbols-have-weak-binding-and-others-global
[4]: https://leondong1993.github.io/2017/04/strong-weak-symbol
[5]: https://en.wikipedia.org/wiki/Weak_symbol
[6]: https://en.wikipedia.org/wiki/Linkage_(software)
<!-- prettier-ignore-end -->
