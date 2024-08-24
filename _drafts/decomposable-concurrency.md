---
layout: post
header: default
title: "Decomposable Concurrency"
author: Braden Hitchcock
---

Data. That's what the world spins around. The primary goal of many software
systems in the [Information Age] is to ingest data and transform it into a
format that makes it easier for consumers to digest. Sometimes those consumers
are other people. Sometimes they are other programs.

The sheer volume of data coupled with the [increasing cost of hardware] is
driving a movement towards more efficient, concurrent programs: software that is
designed to take advantage of all the hardware available on a single machine and
scale horizontally to other machines as needed. This paradigm shift has led to
the development of patterns at the architectural level, foremost among them
being the [Microservices Architecture].

But breaking down your capabilities into isolated services won't help improve
performance or save costs if each individual app is bloated. This means you have
to leverage concurrency _within_ your applications.

Oftentimes concurrency and paralleism are approached with little consideration
to design. This eventually leads to increased technical debt, degredation of
software quality, and increases in maintainence costs.

## Data Processing Architecture

## Applying Architecture to Concurrent Design

### Treat Threads as Isolated Components

### Define Robust Interface Types

### Use Channels for Pub/Sub

### Use Mutexes for Request/Response

### Keep Parallelization an Implementation Detail

## Conclusions

<!-- prettier-ignore-start -->
[Information Age]: https://en.wikipedia.org/wiki/Information_Age
[increasing cost of hardware]: https://www.splunk.com/en_us/blog/learn/cloud-cost-trends.html
[Microservices Architecture]: https://microservices.io/
<!-- prettier-ignore-end -->
