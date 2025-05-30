# Casazium License Server

[![Coverage Status](https://coveralls.io/repos/github/casazium/license/badge.svg?branch=main)](https://coveralls.io/github/casazium/license?branch=main)

A self-hostable Node.js service for managing encrypted license keys with expiration and support for tiered plans. Designed to be used with other Casazium services like `casazium-auth`, or any commercial software product requiring secure license enforcement.

## Features

- AES-256-GCM encryption for license keys
- License key generation and validation
- Key expiration handling
- Tiered license support (e.g., Free, Pro, Enterprise)
- Fastify-based backend
- Environment-specific config handling
- Designed for extensibility and embedding into other systems

## Getting Started

### Requirements

- Node.js 18+
- SQLite (default, no setup required)
