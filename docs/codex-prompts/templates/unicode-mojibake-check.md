# Unicode / Mojibake Check

Use this template when a task includes Chinese text or other non-ASCII text that must be preserved exactly.

This task includes Chinese text. Preserve all Chinese characters exactly as written.

Before finishing:
1. Inspect every file modified by this task that contains Chinese text.
2. Search for common mojibake markers:
   - `Ã`
   - `Â`
   - `â`
   - `ï¼`
   - `�`
   - suspicious sequences such as `è`, `å`, or `ä` where Chinese text was expected
3. If Chinese text is written into a database or generated file, read it back from the destination and confirm it matches the source text.
4. Do not copy Chinese text from terminal output if it appears garbled. Use the source prompt or source file directly.
5. If mojibake is detected, STOP and report:
   - file/path where it appears
   - expected text
   - actual text
   - likely source of the encoding problem
   - proposed fix

Acceptance criteria:
- Chinese text in source files matches the prompt/source text.
- Chinese text read back from generated storage, if any, matches the prompt/source text.
- No common mojibake markers appear in modified files unless intentionally present in documentation explaining mojibake.

Notes:
- Searching for `è`, `å`, or `ä` can produce false positives for valid European-language text.
- Treat the search as a review trigger, not proof of corruption.
