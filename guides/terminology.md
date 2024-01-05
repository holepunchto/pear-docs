# Terminology

## append-only logs

Append-only logs are basically arrays you can only append to. If you think about it in terms of normal array operations, it is a log where you can only call get (index), push (data) and retrieve the log length, but where you can never overwrite old entries.

Using append-only logs, Hypercore can easily generate compressed bitfields describing which portions of a log a peer has. This, among other things, helps make the replication protocol light and efficient.

## atomic batch insertions

A process for inserting multiple data items into a database in a single operation, ensuring that either all of the items are inserted or none of them are.

## b-tree

A self-balancing tree data structure that is used to store data in a sorted and searchable manner.

## BitTorrent

A decentralized file-sharing protocol that allows users to download and share files directly with each other, rather than downloading them from a central server.

## client

A device or computer that requests data or services from a server.

## decryption

The process of converting encrypted data back into its original form.

## DHT (Distributed Hash Table)

A decentralized data structure that is used to store and retrieve data over a network. The HyperDHT is used to facilitate the discovery of peers and to enable connections between them.

## diffing

The process of comparing two data sets to identify their differences.

## discovery key

A unique identifier that is used to identify a Hypercore and to discover other peers that have replicas of the same Hypercore.

## encryption

The process of converting data into a coded form that can only be accessed or decrypted by someone who has the appropriate key or password.

## end-to-end (E2E)

A type of communication or networking in which data is transmitted directly between the sender and the recipient, without passing through any intermediaries.

## hole-punching

A technique for establishing connections between peers behind firewalls or NATs (Network Address Translators) by sending packets to a mediating server that helps establish the connection.

## key/value store

A database that stores data in the form of key/value pairs, where each key is unique and is associated with a specific value.

## merkle tree

A tree-like data structure that is used to verify the integrity of data by generating a hash of the data and storing it in a tree-like structure.

## namespace

A container for a set of identifiers, such as variables or functions, that is used to prevent naming conflicts and to organize code.

## networking

The process of connecting devices or computers together for the purpose of communication or data exchange.

## peer

A computer or device that is connected to a network and able to communicate with other peers.

## peer-to-peer (P2P)

A type of communication or networking in which each device or computer acts as both a client and a server, allowing for direct communication between devices without the need for a central server.

## protocol

A set of rules or standards that govern the format and content of data transmitted over a network.

## random-access storage

A type of storage that allows for fast and efficient access to any part of the stored data, regardless of its location.

## server

A device or computer that provides data or services to clients.

## session

A period of time during which a user interacts with a computer or device.

## sorted iterator

An iterator that returns the elements of a data structure in sorted order.

## topic

A subject or theme that is being announced or shared by a group of peers.

## UDP (User Datagram Protocol)

A protocol for sending data across a network that is designed to be fast and efficient. In Hyperswarm, UDP is used as the underlying protocol for hole-punching, which is a technique for establishing connections between peers behind firewalls or NATs.
