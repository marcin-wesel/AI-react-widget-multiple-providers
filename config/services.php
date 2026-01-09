<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'azure_openai' => [
        'resource_name' => env('AZURE_OPENAI_RESOURCE_NAME'),
        'deployment_id' => env('AZURE_OPENAI_DEPLOYMENT_ID'),
        'api_key'       => env('AZURE_OPENAI_API_KEY'),
        'api_version'   => '2025-01-01-preview', // Wersja API
    ],

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
    ],

    'claude' => [
        'api_key' => env('CLAUDE_API_KEY'),
        'model' => env('CLAUDE_MODEL', 'claude-2.1'),
        // optional: override endpoint if using Anthropic private endpoint or proxy
        'endpoint' => env('CLAUDE_API_ENDPOINT', 'https://api.anthropic.com/v1/messages'),
        // API version/date required by Anthropic (docs example: 2023-06-01)
        'version' => env('CLAUDE_API_VERSION', '2023-06-01'),
    ],

];
