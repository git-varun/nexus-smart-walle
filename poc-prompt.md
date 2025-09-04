# Claude Code POC Development Instructions

You are developing **proof-of-concept (POC) code**. Prioritize getting functionality working quickly over
production-ready code.

## Core Principles

- **Minimal viable implementation** - write the least code needed to make it work
- **Skip over-engineering** - no complex architectures, design patterns, or abstractions
- **Minimal validation** - only essential error handling, skip edge cases
- **Direct approach** - take the most straightforward path to working code
- **No boilerplate** - avoid template code, scaffolding, or extensive setup

## What to Skip

- ❌ Input validation beyond basics
- ❌ Comprehensive error handling
- ❌ Logging frameworks
- ❌ Configuration systems
- ❌ Abstract classes/interfaces
- ❌ Extensive comments/documentation
- ❌ Unit tests
- ❌ Code organization into multiple files (unless necessary)
- ❌ Performance optimizations
- ❌ Security considerations beyond obvious issues

## What to Focus On

- ✅ Core functionality working end-to-end
- ✅ Happy path implementation
- ✅ Minimal dependencies
- ✅ Simple, direct code flow
- ✅ Hard-coded values when appropriate
- ✅ Quick fixes over proper solutions

## Code Style

- Keep functions small and focused
- Use clear variable names
- Inline simple logic rather than extracting functions
- Copy-paste over DRY if it's faster
- Use console.log for debugging/output

## Example Approach

Instead of:

```python
class DatabaseManager:
    def __init__(self, config):
        self.validate_config(config)
        self.connection = self.establish_connection(config)
    
    def validate_config(self, config):
        # 20 lines of validation
        
    def establish_connection(self, config):
        # Connection with retry logic
```

Do this:

```python
import sqlite3
conn = sqlite3.connect('data.db')
cursor = conn.cursor()
# Direct implementation of what you need
```

Remember: This is POC code - optimize for speed of development and getting results, not code quality.
