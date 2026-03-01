<?php
/**
 * Plato_LLM
 *
 * LLM provider abstraction. Supports OpenAI and Anthropic.
 * API keys stored encrypted in wp_options.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Plato_LLM {

    const OPTION_PROVIDER  = 'plato_llm_provider';
    const OPTION_API_KEY   = 'plato_llm_api_key';
    const OPTION_MODEL     = 'plato_llm_model';

    const PROVIDER_OPENAI    = 'openai';
    const PROVIDER_ANTHROPIC = 'anthropic';

    const DEFAULT_MODELS = array(
        'openai'    => 'gpt-4o-mini',
        'anthropic' => 'claude-sonnet-4-20250514',
    );

    const RATE_LIMIT = 50; // messages per hour per user

    // ─── Settings ────────────────────────────────────────────────────────────

    public static function get_provider(): string {
        return get_option( self::OPTION_PROVIDER, self::PROVIDER_OPENAI );
    }

    public static function get_api_key(): string|false {
        $encrypted = get_option( self::OPTION_API_KEY, '' );
        if ( empty( $encrypted ) ) {
            return false;
        }
        return plato_decrypt( $encrypted );
    }

    public static function get_model(): string {
        $model = get_option( self::OPTION_MODEL, '' );
        if ( ! empty( $model ) ) {
            return $model;
        }
        return self::DEFAULT_MODELS[ self::get_provider() ] ?? 'gpt-4o-mini';
    }

    public static function save_settings( string $provider, string $api_key, string $model = '' ): bool {
        update_option( self::OPTION_PROVIDER, sanitize_text_field( $provider ) );
        update_option( self::OPTION_API_KEY, plato_encrypt( $api_key ) );
        if ( ! empty( $model ) ) {
            update_option( self::OPTION_MODEL, sanitize_text_field( $model ) );
        }
        return true;
    }

    public static function is_configured(): bool {
        return self::get_api_key() !== false;
    }

    // ─── System Prompt ───────────────────────────────────────────────────────

    public static function build_system_prompt( string $mode, ?object $course = null, ?string $study_notes_context = null ): string {
        $base = "You are Plato, a warm, encouraging AI tutor. You help university students understand their course material deeply.";

        if ( $mode === 'eli5' ) {
            $base .= "\n\nELI5 MODE ACTIVE: Explain everything as simply as possible. Use everyday analogies, avoid jargon. "
                    . "Imagine you're explaining to a curious 10-year-old. Use short sentences and concrete examples.";
        } elseif ( $mode === 'training' ) {
            $base .= "\n\nTRAINING DISCUSSION MODE: You are helping the student learn and understand this specific module's content. "
                    . "Use a Socratic approach — ask questions, encourage exploration, and guide understanding. "
                    . "When they ask about a concept, explain it clearly and then check their understanding with a follow-up question. "
                    . "Refer to the module content provided below to give accurate, specific answers. "
                    . "Keep the conversation focused on this module's topics. "
                    . "Be encouraging and patient — this is a learning conversation, not a test.";
        } else {
            $base .= "\n\nSOCRATIC MODE: Guide the student to understanding through questions. "
                    . "Don't just give answers — ask probing questions that help them think through the problem. "
                    . "When they're stuck, give a small hint and another question. "
                    . "Celebrate when they figure something out.";
        }

        $base .= "\n\nIMPORTANT RULES:"
                . "\n- Never write essays, assignments, or assessments for the student."
                . "\n- Never provide complete answers to homework or exam questions."
                . "\n- If asked to write an assignment, redirect to helping them understand the concepts instead."
                . "\n- You can review drafts and give feedback, but never generate content they'll submit."
                . "\n- Keep responses focused and concise — students are busy.";

        if ( $course ) {
            $base .= "\n\nCOURSE CONTEXT:"
                    . "\n- Course: {$course->name} ({$course->course_code})"
                    . "\n- Tailor your explanations to this course's subject area.";
        }

        if ( $study_notes_context ) {
            $base .= "\n\nSTUDY NOTES FROM COURSE MATERIALS:"
                    . "\nThe student has uploaded lecture slides/documents for this course. "
                    . "Use the following extracted study notes to provide accurate, course-specific guidance:\n\n"
                    . $study_notes_context;
        }

        return $base;
    }

    // ─── Chat Completion ─────────────────────────────────────────────────────

    /**
     * Send a chat completion request.
     *
     * @param array  $messages Array of { role, content } message objects.
     * @param string $mode     'socratic' or 'eli5'.
     * @param object|null $course Course context object.
     * @return array|WP_Error { content: string, tokens_used: int }
     */
    public static function chat( array $messages, string $mode = 'socratic', ?object $course = null, ?string $study_notes_context = null ): array|WP_Error {
        $api_key = self::get_api_key();
        if ( ! $api_key ) {
            return new WP_Error( 'plato_llm_not_configured', 'LLM API key not configured. Go to Settings to add one.', array( 'status' => 400 ) );
        }

        $provider = self::get_provider();
        $model    = self::get_model();
        $system   = self::build_system_prompt( $mode, $course, $study_notes_context );

        if ( $provider === self::PROVIDER_ANTHROPIC ) {
            return self::call_anthropic( $api_key, $model, $system, $messages );
        }

        return self::call_openai( $api_key, $model, $system, $messages );
    }

    /**
     * Stream a chat completion (outputs SSE directly, does not return).
     */
    public static function chat_stream( array $messages, string $mode = 'socratic', ?object $course = null ) {
        $api_key = self::get_api_key();
        if ( ! $api_key ) {
            return new WP_Error( 'plato_llm_not_configured', 'LLM API key not configured.', array( 'status' => 400 ) );
        }

        $provider = self::get_provider();
        $model    = self::get_model();
        $system   = self::build_system_prompt( $mode, $course );

        if ( $provider === self::PROVIDER_ANTHROPIC ) {
            return self::stream_anthropic( $api_key, $model, $system, $messages );
        }

        return self::stream_openai( $api_key, $model, $system, $messages );
    }

    // ─── OpenAI ──────────────────────────────────────────────────────────────

    private static function call_openai( string $api_key, string $model, string $system, array $messages ): array|WP_Error {
        $api_messages = array_merge(
            array( array( 'role' => 'system', 'content' => $system ) ),
            $messages
        );

        $response = wp_remote_post( 'https://api.openai.com/v1/chat/completions', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type'  => 'application/json',
            ),
            'body'    => wp_json_encode( array(
                'model'       => $model,
                'messages'    => $api_messages,
                'max_tokens'  => 1024,
                'temperature' => 0.7,
            ) ),
            'timeout' => 60,
        ) );

        if ( is_wp_error( $response ) ) {
            return new WP_Error( 'plato_llm_request_failed', $response->get_error_message() );
        }

        $status = wp_remote_retrieve_response_code( $response );
        $body   = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $status >= 400 ) {
            $error_msg = $body['error']['message'] ?? "OpenAI API returned $status";
            return new WP_Error( 'plato_llm_api_error', $error_msg, array( 'status' => $status ) );
        }

        return array(
            'content'     => $body['choices'][0]['message']['content'] ?? '',
            'tokens_used' => $body['usage']['total_tokens'] ?? 0,
        );
    }

    private static function stream_openai( string $api_key, string $model, string $system, array $messages ): void {
        $api_messages = array_merge(
            array( array( 'role' => 'system', 'content' => $system ) ),
            $messages
        );

        $payload = wp_json_encode( array(
            'model'       => $model,
            'messages'    => $api_messages,
            'max_tokens'  => 1024,
            'temperature' => 0.7,
            'stream'      => true,
        ) );

        self::start_sse();

        $ch = curl_init( 'https://api.openai.com/v1/chat/completions' );
        curl_setopt_array( $ch, array(
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => array(
                'Authorization: Bearer ' . $api_key,
                'Content-Type: application/json',
            ),
            CURLOPT_RETURNTRANSFER => false,
            CURLOPT_TIMEOUT        => 120,
            CURLOPT_WRITEFUNCTION  => function ( $ch, $data ) {
                $lines = explode( "\n", $data );
                foreach ( $lines as $line ) {
                    $line = trim( $line );
                    if ( empty( $line ) || ! str_starts_with( $line, 'data: ' ) ) {
                        continue;
                    }
                    $json_str = substr( $line, 6 );
                    if ( $json_str === '[DONE]' ) {
                        echo "data: [DONE]\n\n";
                        self::flush_output();
                        continue;
                    }
                    $parsed = json_decode( $json_str, true );
                    $delta  = $parsed['choices'][0]['delta']['content'] ?? '';
                    if ( $delta !== '' ) {
                        echo 'data: ' . wp_json_encode( array( 'content' => $delta ) ) . "\n\n";
                        self::flush_output();
                    }
                }
                return strlen( $data );
            },
        ) );

        curl_exec( $ch );

        $err = curl_error( $ch );
        if ( $err ) {
            echo 'data: ' . wp_json_encode( array( 'error' => $err ) ) . "\n\n";
            self::flush_output();
        }

        curl_close( $ch );
        exit;
    }

    // ─── Anthropic ───────────────────────────────────────────────────────────

    private static function call_anthropic( string $api_key, string $model, string $system, array $messages ): array|WP_Error {
        $response = wp_remote_post( 'https://api.anthropic.com/v1/messages', array(
            'headers' => array(
                'x-api-key'         => $api_key,
                'anthropic-version' => '2023-06-01',
                'Content-Type'      => 'application/json',
            ),
            'body'    => wp_json_encode( array(
                'model'      => $model,
                'system'     => $system,
                'messages'   => $messages,
                'max_tokens' => 1024,
            ) ),
            'timeout' => 60,
        ) );

        if ( is_wp_error( $response ) ) {
            return new WP_Error( 'plato_llm_request_failed', $response->get_error_message() );
        }

        $status = wp_remote_retrieve_response_code( $response );
        $body   = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $status >= 400 ) {
            $error_msg = $body['error']['message'] ?? "Anthropic API returned $status";
            return new WP_Error( 'plato_llm_api_error', $error_msg, array( 'status' => $status ) );
        }

        $content = '';
        foreach ( $body['content'] ?? array() as $block ) {
            if ( $block['type'] === 'text' ) {
                $content .= $block['text'];
            }
        }

        $tokens_used = ( $body['usage']['input_tokens'] ?? 0 ) + ( $body['usage']['output_tokens'] ?? 0 );

        return array(
            'content'     => $content,
            'tokens_used' => $tokens_used,
        );
    }

    private static function stream_anthropic( string $api_key, string $model, string $system, array $messages ): void {
        $payload = wp_json_encode( array(
            'model'      => $model,
            'system'     => $system,
            'messages'   => $messages,
            'max_tokens' => 1024,
            'stream'     => true,
        ) );

        self::start_sse();

        $ch = curl_init( 'https://api.anthropic.com/v1/messages' );
        curl_setopt_array( $ch, array(
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => array(
                'x-api-key: ' . $api_key,
                'anthropic-version: 2023-06-01',
                'Content-Type: application/json',
            ),
            CURLOPT_RETURNTRANSFER => false,
            CURLOPT_TIMEOUT        => 120,
            CURLOPT_WRITEFUNCTION  => function ( $ch, $data ) {
                $lines = explode( "\n", $data );
                foreach ( $lines as $line ) {
                    $line = trim( $line );
                    if ( empty( $line ) || ! str_starts_with( $line, 'data: ' ) ) {
                        continue;
                    }
                    $json_str = substr( $line, 6 );
                    $parsed   = json_decode( $json_str, true );
                    if ( ! $parsed ) {
                        continue;
                    }

                    $type = $parsed['type'] ?? '';

                    if ( $type === 'content_block_delta' ) {
                        $delta = $parsed['delta']['text'] ?? '';
                        if ( $delta !== '' ) {
                            echo 'data: ' . wp_json_encode( array( 'content' => $delta ) ) . "\n\n";
                            self::flush_output();
                        }
                    } elseif ( $type === 'message_stop' ) {
                        echo "data: [DONE]\n\n";
                        self::flush_output();
                    } elseif ( $type === 'error' ) {
                        $err = $parsed['error']['message'] ?? 'Unknown error';
                        echo 'data: ' . wp_json_encode( array( 'error' => $err ) ) . "\n\n";
                        self::flush_output();
                    }
                }
                return strlen( $data );
            },
        ) );

        curl_exec( $ch );

        $err = curl_error( $ch );
        if ( $err ) {
            echo 'data: ' . wp_json_encode( array( 'error' => $err ) ) . "\n\n";
            self::flush_output();
        }

        curl_close( $ch );
        exit;
    }

    // ─── Summarization (P3: Document Ingestion) ─────────────────────────────

    /**
     * Summarize a chunk of document text into study notes.
     *
     * @param string $content    The raw text chunk.
     * @param string $course_name Course name for context.
     * @return array|WP_Error { content: string, tokens_used: int }
     */
    public static function summarize( string $content, string $course_name ): array|WP_Error {
        $api_key = self::get_api_key();
        if ( ! $api_key ) {
            return new WP_Error( 'plato_llm_not_configured', 'LLM API key not configured.' );
        }

        $system = "You are a study notes summarizer. Summarize the following lecture content into concise, well-structured study notes. "
                . "Focus on key concepts, definitions, formulas, and important points. "
                . "Course: {$course_name}. Keep it under 200 words. Use bullet points where helpful.";

        $messages = array( array( 'role' => 'user', 'content' => $content ) );

        $provider = self::get_provider();
        $model    = self::get_model();

        if ( $provider === self::PROVIDER_ANTHROPIC ) {
            return self::call_anthropic( $api_key, $model, $system, $messages );
        }

        return self::call_openai( $api_key, $model, $system, $messages );
    }

    // ─── SSE Helpers ─────────────────────────────────────────────────────────

    private static function start_sse(): void {
        // Disable output buffering.
        while ( ob_get_level() ) {
            ob_end_clean();
        }

        header( 'Content-Type: text/event-stream' );
        header( 'Cache-Control: no-cache' );
        header( 'Connection: keep-alive' );
        header( 'X-Accel-Buffering: no' ); // nginx

        // CORS — allow the PWA origin.
        $origin = isset( $_SERVER['HTTP_ORIGIN'] ) ? $_SERVER['HTTP_ORIGIN'] : '';
        $allowed = array( 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://plato.local' );
        if ( in_array( $origin, $allowed, true ) ) {
            header( 'Access-Control-Allow-Origin: ' . $origin );
            header( 'Access-Control-Allow-Credentials: true' );
        }
    }

    private static function flush_output(): void {
        if ( ob_get_level() ) {
            ob_flush();
        }
        flush();
    }
}
