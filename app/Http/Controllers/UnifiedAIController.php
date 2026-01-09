<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Exception;
use Log;

class UnifiedAIController extends Controller
{
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'provider' => 'required|string|in:openai,azure,claude',
        ]);

        $message = $request->input('message') ?? 'Opowiedz krótki żart';
        $provider = $request->input('provider') ?? 'azure';

        return response()->stream(function () use ($provider, $message) {

            $stream = match ($provider) {
                'azure'  => $this->streamAzureOpenAI($message),
                'openai' => $this->streamOpenAI($message),
                'claude' => $this->streamClaude($message),
                default  => throw new Exception("Provider not supported"),
            };

            if (!$stream) {
                Log::error('Stream jest pusty!');
                return response()->json(['error' => 'Brak odpowiedzi z AI'], 500);
            }

            if (isset($stream->error)) {
                Log::error('API Error: ' . json_encode($stream->error));
            }

            foreach ($stream as $chunk) {
                $payload = json_encode(['content' => $chunk]);
                echo "data: " . $payload . "\n\n";
                
                if (ob_get_length()) ob_flush();
                flush();

                usleep((int) env('AI_STREAM_USLEEP_MICROS', 20000));
            }

            echo "data: [DONE]\n\n";
            flush();

        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    private function streamAzureOpenAI(string $userMessage)
    {
        $resource = config('services.azure_openai.resource_name');
        $deployment = config('services.azure_openai.deployment_id');
        $apiVersion = '2025-01-01-preview';
        $apiKey = config('services.azure_openai.api_key');

        $url = "https://{$resource}.cognitiveservices.azure.com/openai/deployments/{$deployment}/chat/completions?api-version={$apiVersion}";

        $response = Http::withOptions(['stream' => true])
            ->withHeaders([
                'Content-Type' => 'application/json',
                'Authorization' => "Bearer {$apiKey}", 
                
            ])->post($url, [
                'messages' => [
                    ['role' => 'user', 'content' => $userMessage],
                ],
                'model' => $deployment,
                'max_completion_tokens' => 13107,
                'temperature' => 1,
                'top_p' => 1,
                'frequency_penalty' => 0,
                'presence_penalty' => 0,
                'stream' => true,
            ]);

        $body = $response->toPsrResponse()->getBody();

        while (!$body->eof()) {
            $line = self::readLine($body);
            if (empty($line)) continue;

            if (str_starts_with($line, 'data: ')) {
                $jsonStr = trim(substr($line, 6));
                if ($jsonStr === '[DONE]') break;

                $data = json_decode($jsonStr, true);
                
                if (isset($data['choices'][0]['delta']['content'])) {
                    yield $data['choices'][0]['delta']['content'];
                }
            }
        }
    }

    private function streamOpenAI(string $userMessage)
    {
        $apiKey = config('services.openai.api_key');
        $model = config('services.openai.model');

        $url = 'https://api.openai.com/v1/chat/completions';

        $response = Http::withOptions(['stream' => true])
            ->withHeaders([
                'Content-Type' => 'application/json',
                'Authorization' => "Bearer {$apiKey}",
            ])->post($url, [
                'model' => $model,
                'messages' => [
                    ['role' => 'user', 'content' => $userMessage],
                ],
                'temperature' => 1,
                'top_p' => 1,
                'frequency_penalty' => 0,
                'presence_penalty' => 0,
                'stream' => true,
            ]);

        $body = $response->toPsrResponse()->getBody();

        while (!$body->eof()) {
            $line = self::readLine($body);
            if (empty($line)) continue;

            if (str_starts_with($line, 'data: ')) {
                $jsonStr = trim(substr($line, 6));
                if ($jsonStr === '[DONE]') break;

                $data = json_decode($jsonStr, true);

                if (isset($data['choices'][0]['delta']['content'])) {
                    yield $data['choices'][0]['delta']['content'];
                }
            }
        }
    }

    private function streamClaude(string $userMessage)
    {
        $apiKey = config('services.claude.api_key');
        $model = config('services.claude.model');

        $url = config('services.claude.endpoint');

        $claudeVersion = config('services.claude.version');

        $headers = [
            'Content-Type' => 'application/json',
            'x-api-key' => $apiKey,
        ];

        if (!empty($claudeVersion)) {
            $headers['anthropic-version'] = $claudeVersion;
        }

        $response = Http::withOptions(['stream' => true])
            ->withHeaders($headers)
            ->post($url, [
                'model' => $model,
                'messages' => [
                    ['role' => 'user', 'content' => $userMessage],
                ],
                'max_tokens' => 1024,
                'temperature' => 1,
                'stream' => true,
            ]);

        $body = $response->toPsrResponse()->getBody();

        while (!$body->eof()) {
            $line = self::readLine($body);
            if (empty($line)) continue;

            $trim = trim($line);

            if (str_starts_with($trim, 'event:')) {
                continue;
            }

            if (str_starts_with($trim, 'data:')) {
                $jsonStr = trim(substr($trim, 6));
                if ($jsonStr === '[DONE]') break;

                $data = json_decode($jsonStr, true);
                if (is_array($data)) {
                    if (($data['type'] ?? '') === 'content_block_delta') {
                        $text = $data['delta']['text'] ?? ($data['delta']['text_delta'] ?? null);
                        if ($text !== null && $text !== '') {
                            yield $text;
                        }
                    }
                }

                continue;
            }

            $decoded = json_decode($trim, true);
            if (is_array($decoded)) {
                if (($decoded['type'] ?? '') === 'content_block_delta') {
                    $text = $decoded['delta']['text'] ?? ($decoded['delta']['text_delta'] ?? null);
                    if ($text !== null && $text !== '') {
                        yield $text;
                    }
                    continue;
                }
            }

            continue;
        }
    }

    private static function readLine($stream)
    {
        $buffer = '';
        while (!$stream->eof()) {
            $byte = $stream->read(1);
            if ($byte === "\n") return $buffer;
            $buffer .= $byte;
        }
        return $buffer;
    }
}