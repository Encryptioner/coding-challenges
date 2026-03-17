# Build Your Own Docker

This challenge is to build your own version of Docker.

## Background

Docker is a software platform that allows you to build, test, and deploy applications quickly. It does that by packaging software into container images. These container images include everything needed to run the software - libraries, system tools, configuration and application.

There are two key parts of the Docker ecosystem that we're going to look at in this Coding Challenge, Docker Hub and the Docker Engine.

**Docker Hub** is a container registry. It allows developers to find use and share container images. **Docker Engine**, which provides a container runtime that can run these container images ensuring that the containerized software runs the same wherever it is deployed.

Docker was released in 2013 and revolutionized software deployment by popularizing containerization technology. Unlike virtual machines, containers share the host kernel and are therefore much more lightweight.

## The Challenge - Building Your Own Docker

In this Coding Challenge we're going to build an application to pull a container image from Docker Hub, unpack and run it in our own container runtime.

## Step Zero

Like all the best programming languages we're zero indexed! For this step, you will need to setup your IDE / editor and programming language of choice. Pick something you are happy doing systems programming in. Or one you want to learn how to write systems software in.

If you're not running on Linux, you'll also need to install some software to be able to run a Linux virtual machine image. For Windows and Intel based Apple hardware VirtualBox is a great option. For Apple M based hardware VMware Fusion is free for personal use.

In case you're wondering why you need a Linux virtual machine on Mac and Windows when Docker and Kubernetes don't, well, it's because they do. It's just packaged up in the application so you don't have to worry about it.

Please also download a version of Alpine Linux that is appropriate for your hardware. We'll be using this to test the early versions of our container runtime. Please unpack it in your project directory (don't forget to add it to `.gitignore`) and for later testing create a file in the root of the Alpine installation called `ALPINE_FS_ROOT`.

## Step 1

In this step your goal is to be able to run an arbitrary command launched by your docker clone. For example, when using Docker we might do:

```
% docker run <image> <command> <args>
```

Your goal here is to have the equivalent, but we won't bother with the image for now. I've called my container runtime `ccrun` for Coding Challenges Runtime, I suggest you do the same:

```
% ccrun run <command> <args>
```

To do this your program should:

1. Recognize the run command, and
2. Run the specified command.
3. Have connected up the standard in, standard out and standard error of the command so that they're output to the terminal we run `ccrun` from.

You can test your solution so far by running:

```
% ccrun run echo Hello Coding Challenges!
Hello Coding Challenges!
```

As a final step you should ensure that the exit code returned by the command you run is also returned by your `ccrun` command. You can test that like this:

```
% ccrun run ls .
<files>
% echo $?
0
% ccrun run ls madeupdir
ls: madeupdir: No such file or directory
% echo $?
1
```

It's not very exciting so far, but in the next few steps we'll containerize the command we're running.

## Step 2

In this step your goal is to be able to give your container its own hostname. The goal here is launch the container with its own hostname, whilst not affecting the hostname of the host operating system.

To do this you will need to learn about **Linux namespaces**. You can do that with my favourite reference tool on Linux - `man`. On your Linux VM run the command: `man namespaces` to learn about namespaces (or you can find the namespaces man pages online). The brief summary is:

> A namespace wraps a global system resource in an abstraction that makes it appear to the processes within the namespace that they have their own isolated instance of the global resource. Changes to the global resource are visible to other processes that are members of the namespace, but are invisible to other processes. One use of namespaces is to implement containers.

That last sentence is particularly interesting! If you read further you'll find a list of namespaces, for this step we're interesting in the **UTS namespace**.

To complete this step, you will need to determine how to create a new UTS namespace for the command you're going to run and then use the Linux system call `sethostname` to set the hostname within your container. Read about the system call `clone` to understand how to create the new namespace.

This isn't as simple as it sounds. You'll need to set the hostname from a program running within your new namespace and have that program run the command we want to run within the container. In other words your `ccrun` will want to run a second version of itself within the namespace and have that invoke the command to be run.

## Step 3

In this step your goal is to isolate the processes running inside the container from the host filesystem.

To do this we want to change the root file system for the container, which we can do with the system call `chroot`. Once we do that root of the containers filesystem is set and it can no longer access files outside the new root.

We're going to use Alpine to test this and we want to run a shell in the container. As Alpine uses BusyBox we're going to need to invoke the program we're running containerized slightly differently, like this:

```
ccrun run /bin/busybox sh
/ # ls
ALPINE_FS_ROOT  etc             media           proc            sbin            tmp
bin             home            mnt             root            srv             usr
dev             lib             opt             run             sys             var
/ # cd ..
/ # ls
ALPINE_FS_ROOT  etc             media           proc            sbin            tmp
bin             home            mnt             root            srv             usr
dev             lib             opt             run             sys             var
```

We see the file `ALPINE_FS_ROOT` we created earlier, showing we're in Alpine filesystem. When we try to cd out of the root of the filesystem we can't.

## Step 4

In this step your goal is to isolate the processes within your container from the host processes, this stops the processes within the container being able to see or interact with the host processes.

Once again this is achieved through the use of namespaces. This time we want a new **PID namespace**. The other thing we're going to need to do is mount the `/proc` virtual filesystem. To do that you'll need use the `mount` system call. Again refer to the man page for details. Don't forget to unmount it when terminating the container.

As a final step here we should ensure this new mount is also isolated from the host to do that we want to create a new **Mount namespace** for the container and stop sharing the Mount namespace with the host. Read about the system call `unshare` to find out how to stop sharing.

When this is working you should be able to your container and see only the processes running in the container, something like this.

```
% ccrun run /bin/bash
root@container:/# ps
    PID TTY          TIME CMD
      1 ?        00:00:00 ccrun
      6 ?        00:00:00 bash
      7 ?        00:00:00 ps
```

Equally on your host system you should not be able to see the `/proc` mount for the container when you run the command: `$ mount | grep proc` on the host.

## Step 5

In this step your goal is to run your container rootless. That is we want the root user within the container to not have root privileges on the host operating system. For example if you run `ccrun` right now and then run a long running command in the container, i.e.:

```
% ccrun run /bin/bash
root@container:/# sleep 10000
```

And check for that process on the host, you'll see it's running as the host's root user.

```
$ ps -ef | grep sleep
root        4168    4166  0 08:13 pts/1    00:00:00 sleep 1000
```

That's not very secure. Your challenge for this step is to run the container without root privileges on the host.

To achieve this you will need to create new **User namespace** and set the mappings between the users on the host and container. You can find details of this process in the documentation for user_namespaces.

Use the same tests to verify your solution works, but make sure the user shown on the host is no longer root.

## Step 6

In this step your goal is to limit the resources the container has available to it. This could be memory, number of processes that can be run, the CPU that is available. To do this you will need to learn about **Control groups**. Control groups are usually referred to as **cgroups** and are configured by the `cgroup` filesystem.

You can explore the cgroup filesystem in the folder: `/sys/fs/cgroup/` on the host. For this step of the Coding Challenge you should limit the memory and CPU of the container.

To control these you will need to write the `cgroup` filesystem, the limits for memory are placed in the `memory` subdirectory and the CPU limits in the `cpu` subdirectory.

## Step 7

We've covered many of the elements required to run a container, so now we're going to turn our attention to pulling and running a container image. So, in this step your goal is to pull an image from Docker Hub and unpack it.

To do that you'll need to use the **Docker Registry HTTP API V2** which is part of the CNCF to do the following steps:

1. **Authenticate** - see the authentication section of the documentation.
2. **Fetch the manifest** for the image you wish to download. See the section Pulling an Image Manifest for details.
3. **Parse the manifest** to identify the layers to be downloaded. See the Image Manifest V 2, Schema 2 for details of the fields in the manifest.
4. **Fetch each layer** listed in the manifest. See the section on Pulling a Layer for details.
5. **Unzip the layers** on top of each other to re-create the filesystem. Remember that the layer list is ordered starting from the base image.
6. **Fetch the config data** and store it ready for Step 8.

Be sure to specify the correct library and repository that you wish to authenticate and pull from in each API call.

## Step 8

In this step your goal is to run the container image you've pulled down. To do that you'll want to `chroot` to the root of the image you've pulled. Optionally allow this to be specified on the command line, like so:

```
% ccrun run ubuntu /bin/bash
```

Assuming your `ccrun` knows which folder contains your downloaded container images. As the final icing on the cake, parse the config data that we saved in the previous step, in particular set the environment variables and working directory.

Congratulations you've built your own lite version of Docker!

## Going Further

There's still plenty more you can do with this challenge, for example:

- Add the ability to pull and then run an image in one go.
- Add support for tags to determine which version of an image to pull and run.
- Add networking support via the network namespace.
- Unpack and create a new unique filesystem root for each container invocation.
- Add support for volume mounts
- Add support for environment variables and entry points
- Implement container networking with bridge networks

## References

- [Build Your Own Docker](https://codingchallenges.fyi/challenges/challenge-docker)
- [Docker Registry HTTP API V2](https://docs.docker.com/registry/spec/api/)
- [Linux Namespaces](https://man7.org/linux/man-pages/man7/namespaces.7.html)
- [Control Groups](https://man7.org/linux/man-pages/man7/cgroups.7.html)
- [chroot](https://man7.org/linux/man-pages/man2/chroot.2.html)
