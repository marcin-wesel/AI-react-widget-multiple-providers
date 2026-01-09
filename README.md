# AI React Chat Widget for Laravel

A lightweight, extensible AI chat widget built with React and Laravel — supports multiple AI providers, streaming responses, and easy integration into existing Laravel apps.

## Features
- Multiple AI provider support (configurable via environment)
- React-based chat widget that mounts into your frontend
- Laravel API endpoints for secure server-side calls
- Streaming-capable parser (see app/Services/AIStreamParser.php)
- Easily customizable UI and provider logic

## Quick Start
Prerequisites: PHP 8.1+, Composer, Node.js 18+, and a Laravel app (this repo).

1. Install backend dependencies

```bash
composer install
cp .env.example .env
php artisan key:generate
```

2. Configure environment variables (example)

```bash
# .env
OPENAI_API_KEY=sk-...
```

3. Run database migrations (if required)

```bash
php artisan migrate
```

4. Install frontend dependencies and build

```bash
npm install
npm run dev
```

5. Serve the application

```bash
php artisan serve
```

## Integration
- The React widget lives in `resources/js` and can be mounted in your frontend pages. Import and mount the main component where needed.
- Laravel routes and controllers expose API endpoints for handling provider requests and session management.

## Configuration
- Provider selection and keys are configured via `.env`.
- For streaming responses, the repository includes an `AIStreamParser` service in `app/Services/` to parse server-sent or chunked responses.

## Usage Example

1. Include the widget in your frontend entry (example using Vite):

```tsx
import ChatComponent from '@/components/chat-component';

<div className="fixed bottom-4 right-4 z-50">
    <ChatComponent />
</div>
```

2. The widget calls Laravel endpoints which forward requests securely to the configured AI provider.

## Testing
- Run the test suite (Pest / PHPUnit):

```bash
./vendor/bin/pest
```

## Contributing
- Feel free to open issues or PRs. Suggestions: add new provider adapters, improve streaming UX, or add accessibility improvements.

## License
- MIT — see the LICENSE file for details.
