# Build Your Own cut Tool

This challenge is to build your own version of the Unix command line tool `cut`!

## Background

The Unix command line tools are a great metaphor for good software engineering and they follow the Unix Philosophies of:

- **Writing simple parts connected by clean interfaces** - each tool does just one thing and provides a simple CLI that handles text input from either files or file streams.
- **Design programs to be connected to other programs** - each tool can be easily connected to other tools to create incredibly powerful compositions.

Following these philosophies has made the simple unix command line tools some of the most widely used software engineering tools - allowing us to create very complex text data processing pipelines from simple command line tools.

You can read more about the Unix Philosophy in the excellent book [The Art of Unix Programming](https://www.oreilly.com/library/view/the-art-of/0131429019/).

## The Challenge - Building cut

The functional requirements for `cut` are concisely described by its man page - give it a go in your local terminal now:

```bash
man cut
```

**TL;DR**: `cut` – cut out selected portions of each line of a file.

## Step Zero

Like all good software engineering we're zero indexed! In this step you're going to set your environment up ready to begin developing and testing your solution.

I'll leave you to setup your IDE / editor of choice and programming language of choice. After that here's what I'd like you to do to be ready to test your solution.

**Create test files for testing the cut command.**

## Step One

In this step your goal is to write a simple version of `cut`, let's call it `cccut` (cc for Coding Challenges) that takes the command line option `-f` and outputs the specified fields from a file.

Create a test file:
```bash
echo -e "one\ttwo\tthree" > test.txt
```

If you've done it right your output should match this:

```bash
cccut -f 1 test.txt
one
```

If it doesn't, check your code, fix any bugs and try again. If it does, congratulations! On to...

## Step Two

In this step your goal is to support multiple fields and field ranges with the `-f` option.

If you've done it right your output should match this:

```bash
cccut -f 1,2 test.txt
one	two

cccut -f 1-2 test.txt
one	two
```

If it doesn't, check your code, fix any bugs and try again. If it does, congratulations! On to...

## Step Three

In this step your goal is to support the command line option `-d` that allows the user to specify what character to use as the delimiter between fields. The default delimiter is TAB.

Create a CSV test file:
```bash
echo "one,two,three" > test.csv
```

If you've done it right your output should match this:

```bash
cccut -f 1 -d , test.csv
one

cccut -f 1,3 -d , test.csv
one,three
```

If it doesn't, check your code, fix any bugs and try again. If it does, congratulations! On to...

## Step Four

In this step your goal is to support the command line option `-b` that outputs specific bytes from each line.

If you've done it right your output should match this:

```bash
echo "hello world" | cccut -b 1-5
hello
```

If it doesn't, check your code, fix any bugs and try again. If it does, congratulations! On to...

## Step Five

In this step your goal is to support the command line option `-c` that outputs specific characters from each line. For ASCII text, this is similar to `-b`, but differs when dealing with multi-byte characters.

If you've done it right your output should match this:

```bash
echo "hello world" | cccut -c 1-5
hello
```

If it doesn't, check your code, fix any bugs and try again. If it does, congratulations! On to...

## The Final Step

In this step your goal is to support being able to read from standard input if no filename is specified, and to properly handle all the options together.

If you've done it right your output should match this:

```bash
cat test.txt | cccut -f 1
one

echo "one,two,three,four" | cccut -f 2-3 -d ,
two,three
```

If it doesn't, check your code, fix any bugs and try again. If it does, congratulations! You've done it, pat yourself on the back, job well done!

## Additional Features

For a complete implementation, consider supporting:
- Multiple field ranges and lists (e.g., `-f 1-3,5,7-9`)
- The `--complement` option to invert the selection
- The `-s` option to suppress lines with no delimiter
- Proper handling of edge cases and error messages

## References
- [Build Your Own cut Tool](https://codingchallenges.fyi/challenges/challenge-cut)
- [cut Man Page](https://man7.org/linux/man-pages/man1/cut.1.html)
