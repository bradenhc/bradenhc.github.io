---
layout: post
header: default
title: "Building Better Tools: Implementing the UNIX Philosophy in C/C++"
author: Braden Hitchcock
comments: https://discordapp.com/channels/904059090358140938/904696336933339156/1279424030348148817
---

Engineering is about building things that last. In every engineering discipline,
engineers strive to invent structures, materials, compounds, and machines that
can be used every day for years to come to make the world a better place.

Software engineering is no different.

When designing and building a software system, we must think about what
practices and patterns we can follow to ensure that our system won't become
obsolete five years after we build it. If you've ever had to do a complete
re-write of a legacy system, you'll know how frustrating poor design can be.
Unfortunately, this is easier said than done; but one of the methods used to
improve the maintainability, flexibility, and extensibility of software is
modular design: building a system out of smaller components that work together
to accomplish a larger goal.

These fundamental principles of modularity and composability are at the heart of
the UNIX Philosophy.

## The UNIX Philosophy

> The UNIX philosophy emphasizes building simple, short, clear, modular, and
> extensible code that can be easily maintained and repurposed by developers
> other than its creators. The UNIX philosophy favors composability as opposed
> to monolithic design. <sup>[1]</sup>

Software engineering is more than just writing code. It's about designing
systems that can adapt to the rapidly changing world around them. The UNIX
Philosophy, originated by Ken Thompson and elaborated on by others, is just one
of the methods we can use to produce such software.

UNIX was originally designed to help build research software. One of the primary
purposes of research is to explore the unknown and adapt to changing
circumstances, so it's only natural that the philosophy driving its design would
be built on modularity and composition. Doug McIlroy, a pioneer in
component-based software engineering, summarized the UNIX philosophy in the 1978
Bell System Technical Journal. Among other things, he mentioned two simple
methods for building composable software: <sup>[2]</sup>

1. Make each program do one thing well.
1. Expect the output of every program to become the input of another.

These two points in particular resonated with me. I am a huge advocate for the
creation of highly-cohesive, loosely-coupled software that facilitates
maintenance and growth, so seeing such a paradigm well-accepted and embedded in
the UNIX system was reassuring. In fact, if you really think about it, this is
exactly what a UNIX shell does: it provides a single interface that allows you
to interact with the system by using hundreds of separate and distinct
executables. Oftentimes, you can combine several of these executables
together&mdash;chaining their inputs and outputs&mdash;to accomplish a larger
goal.

In the context of creating a suite of tools (or a single tool that can be
extended), we can see where this philosophy starts to give us an advantage. The
original creators of UNIX could have built one, monolithic master program that
could do everything all the commands available in a UNIX shell can do, but
imagine the overhead nightmare it would be to maintain and extend such a system.
Luckily, they chose a modular system that could be easily extended not just by
the UNIX creators, but by any developer with a tool in mind.

## Designing a Modular System

It's impossible to know from day one all of the possible ways your software will
be used, even when it is built for a very specific purpose. We as developers
can't imagine exactly how a user will interact with our system, nor can we
anticipate all the possible feature requests we may receive. This is one of the
reasons why customer interaction in agile development methodologies is a key
component to success. We can, however, design our system in such a way that when
we receive an unanticipated request for functionality, we can easily build it
into our system.

A possible high-level design implementation of the UNIX philosophy is diagrammed
in Figure 1.

![The UNIX Philosophy](/public/images/posts/unix-philosophy.png "A possible implementation of the UNIX philosophy")
_Figure 1: A possible implementation of the UNIX philosophy_

We have a single main process that receives a command. Rather than executing the
command's associated action, the main process spawns a child process that has
been specifically built for that action. Prior to spawning the extension
process, the main process sets up the necessary communication channels so that
the extension process can send the results of its work back to its parent.

## The UNIX Philosophy in C/C++

> Standard: C++17, Compiler: GCC 7.5, OS: Linux

Let's assume that we are building a system similar in design to the one in
Figure 1. To keep things simple, our system will act much like `command` from a
UNIX shell: it will invoke the command passed to it as its first argument and
forward the remaining options and arguments to the child process.

Building this program is fairly easy. We can use a few low-level C calls to
spawn child process and enable communication between the parent and child:

- `pipe`: Create a communication channel between parent and child.
- `fork`: Spawn a child process.
- `dup2`: Re-route the child process' standard output to the parent process.
- `execvp`: Execute a sub-command (a separate executable) in the child process.
- `read`: Read the output of the child process.
- `waitpid`: Check in occasionally to see if the child process is still running.

If we revisit the high-level view of our system from Figure 1, we get a more
specific C++ design shown in Figure 2.

![UNIX Philosophy ++](/public/images/posts/unix-philosophy-cpp.png "C++ Implementation for the UNIX Philosophy")
_Figure 2: Using C++ to implement the UNIX Philosophy_

Let's explore this design's implementation by walking through some code.

### Set Up Communication and Spawn the Child

We start off by creating our communication channel using the `pipe` function:

```cpp
#include <unistd.h>

#include <stdexcept>

using std::runtime_error;

int main(int argc, char* argv[]) {
    int channel[2];
    int result = ::pipe(channel);
    if(result < 0) {
        throw runtime_error("failed to open pipe");
    }
}
```

Our `channel` array now holds two file descriptors: `channel[0]` holds the
_read_ end of the pipe, and `channel[1]` holds the _write_ end. Once we have the
channel setup, we can spawn a child process:

```cpp
    int pid = ::fork();
    if (pid < 0) {
        throw runtime_error("failed to spawn child process");
    }

    if (pid == 0) {
        // Child process
    } else {
        // Parent process
    }
```

Now that we have the parent-child process relationship, let's look at the
implementation details for the child (our extension process).

### The Child (Extension) Process

```cpp
        // Child process
        ::dup2(channel[1], STDOUT_FILENO);
        ::close(channel[0]);
        ::close(channel[1]);
        ::execvp(argv[1], argv + 1);
```

Notice that in our child process, we are redirecting the standard output of the
child process into the write end of the pipe using `dup2` and `STDOUT_FILENO`.
This makes it easy for our child process to communicate with the parent without
having to keep track of the file descriptor corresponding to to the write end of
our pipe. Instead, we can just write our output to `stdout` and the parent
process can read it.

We also need to make sure that we close **both** the read and write ends of the
pipe we created earlier. We close the read end because we aren't the ones
reading from the pipe: the parent process is. We close the write end because,
after using `dup2` there are two file descriptors pointing to the same write end
of the pipe, and since we are only going to be using `stdout`, we don't need a
handle on write end of the pipe created with the explicit `pipe` call. Moral of
the code: don't forget to clean up after yourself!

Finally, we use `execvp` to execute the command that is passed to our executable
as the first argument, and we forward the remaining arguments to the command.

### The Parent (Main) Process

```cpp
// #include <sys/types.h>
// #include <sys/wait.h>
// #include <cstring>
// #include <iostream>

        // Parent process
        ::close(channel[1]);

        const int BUF_LEN = 256;
        const int READ_LEN = BUF_LEN - 1;

        char buf[BUF_LEN];
        ::memset(buf, 0, BUF_LEN);

        while (true) {
            int bytesRead = ::read(channel[0], buf, READ_LEN);
            if (bytesRead == 0) {
                // The child process has exited
                ::waitpid(-1, nullptr, 0);
                break;
            }

            std::cout << buf << std::endl;

            result = ::waitpid(-1, nullptr, WNOHANG);
            if (result > 0) {
                // The child has exited, but there might still be data in the
                // pipe. Drain it.
                while (true) {
                    bytesRead = ::read(channel[0], buf, READ_LEN);
                    if (bytesRead == 0) {
                        // There is no more data in the pipe
                        break;
                    }
                    std::cout << buf << std::endl;
                }
                break;
            }
        }

        ::close(channel[0]);
```

Sticking with the theme of cleaning up after ourselves, first thing we do is
close the write end of the pipe. Then, after initializing a buffer, we begin to
read the output of the child process. In this trivial example, all we do is
write that output to the main process' standard output, but you can imagine a
more complicated scenario where the data coming from the child could be a set of
formatted events the parent process is waiting for.

After each call to `read` we check in on the child process with a call to
`waitpid`. We use the `WNOHANG` option flag to force the check to not block our
current thread of execution. If the child process has exited, `waitpid` will
return an integer value greater than zero, so we can proceed to draining the
pipe and then breaking from our read-loop. Otherwise, the child process is still
alive, and we go back for more data.

The other edge case we need to watch out for is when the child process
terminates after our call to `waitpid` but before our next call to `read`. If
this is the case, then `read` will return zero and we can make another call to
`waitpid` to ensure the child process exited (and optionally get its status)
before breaking from our read-loop.

Finally, don't forget to close the read end of the pipe!

### The Entire Program

Putting all the pieces together gives us the following simple program:

```cpp
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

#include <cstring>
#include <iostream>
#include <stdexcept>

using std::runtime_error;

int main(int argc, char* argv[]) {
    int channel[2];
    int result = ::pipe(channel);
    if(result < 0) {
        throw runtime_error("failed to open pipe");
    }

    int pid = ::fork();
    if (pid < 0) {
        throw runtime_error("failed to spawn child process");
    }

    if (pid == 0) {
        // Child process
        ::dup2(channel[1], STDOUT_FILENO);
        ::close(channel[0]);
        ::close(channel[1]);
        ::execvp(argv[1], argv + 1);
    } else {
        // Parent process
        ::close(channel[1]);

        const int BUF_LEN = 256;
        const int READ_LEN = BUF_LEN - 1;

        char buf[BUF_LEN];
        ::memset(buf, 0, BUF_LEN);

        while (true) {
            int bytesRead = ::read(channel[0], buf, READ_LEN);
            if (bytesRead == 0) {
                // The child process has exited
                ::waitpid(-1, nullptr, 0);
                break;
            }

            std::cout << buf << std::endl;

            result = ::waitpid(-1, nullptr, WNOHANG);
            if (result > 0) {
                // The child has exited, but there might still be data in the
                // pipe. Drain it.
                while (true) {
                    bytesRead = ::read(channel[0], buf, READ_LEN);
                    if (bytesRead == 0) {
                        // There is no more data in the pipe
                        break;
                    }
                    std::cout << buf << std::endl;
                }
                break;
            }
        }

        ::close(channel[0]);
    }

    return 0;
}
```

We can then save this as `main.cpp` and compile it using the following command:

```text
g++  -o command main.cpp
```

Then run it using:

```text
./command ls -l
```

Which will output the contents of the current directory.

## Conclusions

The UNIX Philosophy helps us write software that is easier to maintain and
extend. By leveraging a modular design and utilizing composition, adopting this
mindset can help us write software that will better withstand the test of time.
The software will be flexible enough to adapt to the fast-paced changes in the
ever-evolving world of software engineering.

As with all design patterns, this philosophy isn't a silver bullet. Think about
what your software's purpose is and, if it makes sense, try making it more
modular by splitting it into a set of smaller executables that work together to
accomplish your goal.

## References

1. Wikipedia (2020) "UNIX philosophy". visited 30 Apr 2020.
   [https://en.wikipedia.org/wiki/Unix_philosophy][ref-wikipedia-2020]
2. McIlroy D., Pinson, E. N., Tague, B. A. (1978). ["UNIX Time-Sharing System:
   Foreword"][ref-mcilroy-1978]. _The Bell System Technical Journal_. Bell
   Laboratories. pp. 1902–1903.

[ref-wikipedia-2020]: https://en.wikipedia.org/wiki/Unix_philosophy
[ref-mcilroy-1978]: https://archive.org/details/bstj57-6-1899/page/n5/mode/2up
