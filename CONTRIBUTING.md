# Contributing to FieldQuest

Thank you for your interest in contributing to **FieldQuest**! We welcome contributions from naturalists, developers, designers, translators, and educators.

## Code of Conduct

FieldQuest is dedicated to providing a safe, inclusive, welcoming experience for all contributors regardless of experience level, identity, or background. Please treat others with respect and kindness.

---

## Getting Started

1. **Fork and clone** the repository:
   ```bash
   git clone https://github.com/your-username/FieldQuest.git
   cd FieldQuest
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   *Note: You do not need any API keys or private credentials to run FieldQuest. Out of the box, `AI_PROVIDER=demo` runs immediately with zero external dependencies.*

4. **Start the local dev servers:**
   ```bash
   npm run dev
   ```

---

## Development Workflow & Guidelines

### Adding New AI Providers
FieldQuest is designed to evaluate various open-weight models (e.g. Qwen, Gemma, Llama, Mistral). If you want to add a new provider:
- Implement the `AIMissionProvider` interface in `apps/api/src/providers/`.
- Ensure strict compliance with the Zod schema (`NatureMissionSchema`).
- Add comprehensive unit tests in `apps/api/tests/`.

### Nature Mission Safety Rules
All missions generated or curated must adhere to these safety tenets:
- ❌ **Never** encourage foraging or tasting wild mushrooms, berries, or unknown flora.
- ❌ **Never** encourage touching, capturing, or disturbing nesting wildlife or hives.
- ❌ **Never** encourage trespassing on private property, climbing dangerous structures, or entering hazardous waterways.
- ✅ **Always** encourage leave-no-trace ethics, gentle sensory observation, and mindful awareness.

### Pull Request Checklist
Before submitting a pull request, please verify:
- [ ] `npm run lint` passes without errors.
- [ ] `npm run typecheck` passes without TypeScript errors.
- [ ] `npm run test` passes all tests.
- [ ] New features are accompanied by documentation or tests where applicable.

---

## License

By contributing to FieldQuest, you agree that your contributions will be licensed under the [MIT License](LICENSE).
