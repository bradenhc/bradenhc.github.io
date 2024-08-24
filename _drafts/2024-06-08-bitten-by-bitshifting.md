---
layout: post
header: default
title: "Bitten by Bit Shifts"
author: Braden Hitchcock
---

I recently found myself brushing up on one of the most basic operations in
computer science: bit shifts. This led me to a great [article by Lenovo] on the
subject. I wanted to figure out how this all applied to C++, so I ran a few
experiements.

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

## Bit Shifting in C++

C++ uses the type of the value being shifted to determine whether to use a
logical or arithmetic shift.

- Unsigned values use logical left and right shifts.
- Signed values use a logical left shift and an arithmetic right shift.

This means we must choose the types of our values with _intent_. It's amazing to
me how even something as fundemental as bit shifting requires us to design
software well and choose appropriate types to represent the values in our
program!

### Left Shifts

```cpp
char a = 0x01 << 7;
```

If you use `std::bitset` to print the value of `a`, you will get `1000000`.

### Right Shifts

```cpp
char b = 0x80 >> 7;
```

If you use `std::bitset` to print the value of `b`

```cpp
unsigned char c = 0x80 >> 7;
```

## Processing Binary Data

```cpp
std::ifstream input{"data.bin", std::ios::binary};

std::vector<std::byte> buf(1024);
input.read(buf.data(), buf.size());     // 1


std::byte d = buf[0] >> 7;              // 2
```

## Conclusions

Remember your types when you need to bit-shift. Choosing an appropriate type for
the data you are processing will prevent logic errors later in your algorithms.

<!-- prettier-ignore-start -->

[article by Lenovo]: https://www.lenovo.com/gb/en/glossary/bit-shift/
[bit shift operators]: https://en.cppreference.com/w/cpp/language/operator_arithmetic 

<!-- prettier-ignore-end -->
