---
layout: post
header: default
title: "Bitten by Bit Shifts"
author: Braden Hitchcock
comments: https://discordapp.com/channels/904059090358140938/904696336933339156/1279425530701021245
---

I recently found myself decoding some binary data and getting results I wasn't
expecting. This caused me to review one of the most basic operations in computer
science: bit shifts. My "research" led me to a great [article by Lenovo] on the
subject. After a few experiments, I learned another valuable lesson about
strongly-typed languages and why choosing data types with intent is so
important.

## Bit Shift Basics

There are two ways to shift bits: logically and arithmetically. Logical bit
shifting is simple. It will always fill in the vacant bit with a zero. When
dealing with serialized binary data this is nearly always what we want.

```text
1000
0001
```

_Logical right shift_

Arithmetic bit shifting behaves a little differently: it preserves the sign bit
when shifting bits to the right. This difference is based in the fact that
arithmetic bit shifting is equivalent to multiplying or dividing by 2. Shifting
to the left multiplies a value by 2. Shifting to the right divides by 2. This
means that the representation of signed values in binary requires arithmetic
right shifts to fill in the vacant bit with ones and preserve the signedness.

```text
1000
1111
```

_Arithmetic right shift_

This is what bit me. I was decoding binary data using arithmetic right shifts
when I didn't mean to. Why? Because I wasn't using the correct data type to hold
the binary data.

## Bit Shifting in C++

C++ uses the type of the value being shifted to determine whether to use a
logical or arithmetic shift.

- Unsigned values use logical left and right shifts.
- Signed values use a logical left shift and an arithmetic right shift.

This means we must choose the types of our values with _intent_. It's amazing to
me how even something as fundemental as bit shifting requires us to design
software well and choose appropriate types to represent the values in our
program!

Let's look at a few examples. In each example, I will include the binary
representation of the final value. You can print this value in C++ using the
[`std::bitset`] type.

```cpp
// LEFT SHIFTS

char          a = 0x01 << 7;    // prints '10000000'
unsigned char b = 0x01 << 7;    // prints '10000000'

// RIGHT SHIFTS

char          a = 0x80 >> 7;    // prints '11111111'
unsigned char b = 0x80 >> 7;    // prints '00000001'
```

Note that `char` is a signed data type, so the bitshift operator `>>` will
perform an _arithmetic right shift_ to preserve the signedness. However, when we
use `unsigned char`, the operator `>>` will perform a _logical right shift_ and
fill the vacancies with zeros.

## Processing Binary Data

One area where we can see a lot of bitshifting is when decoding binary data. In
this case we almost always want to use unsigned data types to represent the
data. Since C++17, the best way to do this is to use [`std::byte`].

```cpp
std::ifstream input{"data.bin", std::ios::binary};

std::vector<std::byte> buf(1024);       // 1
input.read(buf.data(), buf.size());     // 2

std::byte d = buf[0] >> 7;              // 3
```

At **1**, we pre-allocate a buffer of bytes to store the data int. Then at **2**
we read the data into our buffer. Since `std::byte` is an unsigned type, at
**3** we are performing a logical right shift on the first byte.

We could use `unsigned char`, `uint8_t`, or some other type to represent the
binary data. However, using `std::byte` cleary communicates to the reader that
we are dealing with plain binary data that has to be decoded before it can be
used. This prevents confusion and also forces us to be more explicit with our
conversions in code, and in my experience the more explicit you are the fewer
bugs you encounter.

## Conclusions

Remember your types when you need to bit-shift. Choosing an appropriate type for
the data you are processing will prevent headaches and reduce logic errors later
in your algorithms.

<!-- prettier-ignore-start -->

[article by Lenovo]: https://www.lenovo.com/gb/en/glossary/bit-shift/
[bit shift operators]: https://en.cppreference.com/w/cpp/language/operator_arithmetic 
[`std::bitset`]: https://en.cppreference.com/w/cpp/utility/bitset
[`std::byte`]: https://en.cppreference.com/w/cpp/types/byte

<!-- prettier-ignore-end -->
