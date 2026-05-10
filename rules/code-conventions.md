# Code Conventions

## Before modifying or creating code

**ALWAYS** read 2-3 similar existing files first to extract:
- Import style (named vs default, aliasing, ordering)
- Error handling pattern (try/catch, Result type, toast, logger...)
- Auth/security pattern (guards, middleware, token handling)
- Naming conventions (variables, functions, files, routes)
- State management approach (context, store, hooks...)
- API call style (fetch wrapper, client class, hooks)

Then **critically compare** your proposed approach vs what exists:
- If existing pattern is solid → follow it for consistency
- If existing pattern is flawed → explain why and propose better, don't silently diverge
- **Never silently introduce a new pattern** without noting the trade-off

## Pattern matching rules

- NEVER introduce a new import style, error-handling approach, or auth pattern without checking existing files first
- NEVER use a library already wrapped by a project utility (e.g. if there's `lib/api.ts`, don't raw-fetch)
- NEVER mix patterns in the same file (e.g. both async/await and .then() chains)
- If a helper/util already exists for a task, use it — don't reimplement

## Consistency vs quality

- Consistency wins when the existing code is reasonable
- Quality wins when the existing code has a clear bug, security issue, or major inefficiency
- When choosing quality over consistency: say so explicitly, show the difference, let the user decide
