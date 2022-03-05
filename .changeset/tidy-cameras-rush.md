---
"corset": minor
---

Adds support for Stores

This change adds a new feature "stores". A store is a Map that can be created in any scope within a sheet. The Map will be shared within JS inside of a behavior. It can be passed to child behaviors (through inputProperties) and when a child behavior modifies it, it will rebind() the parent behavior as well.
