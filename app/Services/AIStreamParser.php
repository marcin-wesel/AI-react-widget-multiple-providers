<?php

namespace App\Services;

class AIStreamParser
{
    public static function parse(string $provider, string $rawChunk): ?string
    {
        if (str_contains($rawChunk, '[DONE]'))
            return null;

        preg_match('/data: (\{.*\})/', $rawChunk, $matches);
        if (isset($matches[1])) {
            $data = json_decode($matches[1], true);

            if ($provider === 'openai' || $provider === 'azure')
                return $data['choices'][0]['delta']['content'] ?? '';

            if ($provider === 'claude')
                return $data['delta']['text'] ?? '';
        }

        return null;
    }
}