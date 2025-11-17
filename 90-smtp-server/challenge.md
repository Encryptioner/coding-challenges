# Build Your Own SMTP Server

This challenge is to build your own SMTP Server.

## Background

SMTP, short for Simple Mail Transfer Protocol is the Internet standard for sending email between mail servers and mail transfer agents. If you've ever set up a mail client locally you've probably had to provide details of the SMTP server to use.

SMTP was designed in 1981 and was widely used for email soon after. Modern email has become a bit more complicated as layers have been added to protect against spam.

You can read about SMTP and this evolution on the [Wikipedia SMTP page](https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol).

## The Challenge - Building An SMTP Server

In this coding challenge we will be building a simple SMTP server. One that an SMTP client can connect to and deliver an email to.

Optionally you might also choose to build a simple client to connect to the SMTP server.

## Step Zero

In this introductory step you're going to set your development environment up ready to begin developing and testing your SMTP server.

I'll leave you to choose your target platform, setup your editor and programming language of choice. I'd encourage you to pick one that you're comfortable doing network programming in. We're building a server after all!

## Step 1

In this step your goal is to create a server that listens on port 25 for incoming TCP connections.

When a connection is received the server should respond with a 220 message. See the [RFC 5321](https://tools.ietf.org/html/rfc5321) or the Wikipedia page on SMTP for an example of the protocol in action.

Here's the key bit from the RFC:

> An SMTP session is initiated when a client opens a connection to a server and the server responds with an opening message.
>
> SMTP server implementations MAY include identification of their software and version information in the connection greeting reply after the 220 code

So you could respond with: `220 CC SMTP Server` for example.

## Step 2

In this step your goal is to handle the HELO or EHLO command from the client. The commands are described in the Client Initiation section of the RFC. HELO is all you need to support for this coding challenge.

You'll need to work through the RFC to understand the details of whichever you decide to support.

## Step 3

In this step your goal is to handle the header part of the mail transactions. You will need to refer to the Mail Transactions section of the RFC. Add support for the headers:

- `MAIL FROM:`
- `RCPT TO:`

## Step 4

In this step your goal is to handle the email body part of the mail transactions. This is the DATA part of the message being sent to the server.

Be sure to read the section on transparency in the RFC to ensure you're handling command sequences in the email body.

## Step 5

In this step your goal is to handle concurrent clients. Be sure to test by creating a client that connects and sends email either slowly or many emails giving you time to run others concurrently.

## Going Further

You can this project further by adding support for storing the emails and provide access to them for an email client via POP3 or IMAP. Alternately you can extend the server to support more of SMTP from the relevant RFCs.

## References

- [Build Your Own SMTP Server](https://codingchallenges.fyi/challenges/challenge-smtp)
- [RFC 5321 - SMTP](https://tools.ietf.org/html/rfc5321)
- [Wikipedia - SMTP](https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol)
