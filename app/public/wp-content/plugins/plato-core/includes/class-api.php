<?php
/**
 * Plato_API
 *
 * Registers all REST endpoints under the plato/v1 namespace.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Plato_API {

    const NAMESPACE = 'plato/v1';

    public function register_routes(): void {
        // ─── Auth ────────────────────────────────────────────────────────────
        register_rest_route( self::NAMESPACE, '/auth/login', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'login_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/auth/me', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'me_handler' ),
            'permission_callback' => '__return_true',
        ) );

        // ─── Canvas ─────────────────────────────────────────────────────────
        register_rest_route( self::NAMESPACE, '/canvas/connect', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'canvas_connect_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/canvas/sync', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'canvas_sync_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/canvas/status', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'canvas_status_handler' ),
            'permission_callback' => '__return_true',
        ) );

        // ─── Data ───────────────────────────────────────────────────────────
        register_rest_route( self::NAMESPACE, '/courses', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_courses_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/assignments', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_assignments_handler' ),
            'permission_callback' => '__return_true',
        ) );

        // ─── Chat (P2: Socratic Tutor) ─────────────────────────────────────
        register_rest_route( self::NAMESPACE, '/chat/conversations', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_conversations_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/chat/conversations', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'create_conversation_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/chat/conversations/(?P<id>\d+)', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_conversation_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/chat/conversations/(?P<id>\d+)', array(
            'methods'             => 'DELETE',
            'callback'            => array( $this, 'delete_conversation_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/chat/conversations/(?P<id>\d+)/messages', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'send_message_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/chat/conversations/(?P<id>\d+)/stream', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'stream_message_handler' ),
            'permission_callback' => '__return_true',
        ) );

        // ─── Settings ──────────────────────────────────────────────────────
        register_rest_route( self::NAMESPACE, '/settings/llm', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_llm_settings_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/settings/llm', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'save_llm_settings_handler' ),
            'permission_callback' => '__return_true',
        ) );
    }

    // ─── Auth Handlers ───────────────────────────────────────────────────────

    public function login_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $username = sanitize_text_field( $request->get_param( 'username' ) );
        $password = $request->get_param( 'password' );

        if ( empty( $username ) || empty( $password ) ) {
            return new WP_Error(
                'plato_missing_credentials',
                'Username and password are required.',
                array( 'status' => 400 )
            );
        }

        $user = wp_authenticate( $username, $password );
        if ( is_wp_error( $user ) ) {
            return new WP_Error(
                'plato_invalid_credentials',
                'Invalid username or password.',
                array( 'status' => 401 )
            );
        }

        $token = Plato_Auth::generate_token( $user->ID );

        return new WP_REST_Response( array(
            'token'        => $token,
            'user_id'      => $user->ID,
            'display_name' => $user->display_name,
            'expires'      => time() + Plato_Auth::TOKEN_EXPIRY,
        ), 200 );
    }

    public function me_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $user = get_user_by( 'id', $user_id );

        return new WP_REST_Response( array(
            'user_id'      => $user->ID,
            'display_name' => $user->display_name,
            'email'        => $user->user_email,
        ), 200 );
    }

    // ─── Canvas Handlers ─────────────────────────────────────────────────────

    public function canvas_connect_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $canvas_token = $request->get_param( 'canvas_token' );
        if ( empty( $canvas_token ) ) {
            return new WP_Error(
                'plato_missing_token',
                'canvas_token is required.',
                array( 'status' => 400 )
            );
        }

        $canvas = new Plato_Canvas( $user_id );
        $canvas->save_token( $canvas_token );

        $result = $canvas->sync_all();
        if ( is_wp_error( $result ) ) {
            return new WP_REST_Response( array(
                'success' => false,
                'message' => 'Token saved but sync failed. Will retry in 6 hours.',
                'error'   => $result->get_error_message(),
            ), 200 );
        }

        return new WP_REST_Response( array(
            'success'            => true,
            'message'            => sprintf(
                'Canvas connected. %d courses and %d assignments synced.',
                $result['courses_synced'],
                $result['assignments_synced']
            ),
            'courses_synced'     => $result['courses_synced'],
            'assignments_synced' => $result['assignments_synced'],
            'synced_at'          => $result['synced_at'],
        ), 200 );
    }

    public function canvas_sync_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $canvas = new Plato_Canvas( $user_id );
        if ( ! $canvas->has_token() ) {
            return new WP_Error(
                'plato_no_canvas_token',
                'No Canvas token stored. Connect Canvas first.',
                array( 'status' => 400 )
            );
        }

        $result = $canvas->sync_all();
        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return new WP_REST_Response( array(
            'success'            => true,
            'courses_synced'     => $result['courses_synced'],
            'assignments_synced' => $result['assignments_synced'],
            'synced_at'          => $result['synced_at'],
        ), 200 );
    }

    public function canvas_status_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $canvas = new Plato_Canvas( $user_id );

        return new WP_REST_Response( array(
            'connected' => $canvas->has_token(),
            'hint'      => get_user_meta( $user_id, Plato_Canvas::TOKEN_HINT_META_KEY, true ) ?: null,
            'sync'      => $canvas->get_sync_status(),
        ), 200 );
    }

    // ─── Data Handlers ───────────────────────────────────────────────────────

    public function get_courses_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $courses = Plato_Database::get_courses_for_user( $user_id );
        $canvas  = new Plato_Canvas( $user_id );
        $sync    = $canvas->get_sync_status();

        return new WP_REST_Response( array(
            'courses'     => $courses,
            'total'       => count( $courses ),
            'sync_status' => $sync['status'],
            'last_sync'   => $sync['last_sync'],
        ), 200 );
    }

    public function get_assignments_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $args = array();
        if ( $request->get_param( 'course_id' ) ) {
            $args['course_id'] = absint( $request->get_param( 'course_id' ) );
        }
        if ( $request->get_param( 'upcoming' ) ) {
            $args['upcoming'] = true;
        }
        if ( $request->get_param( 'limit' ) ) {
            $args['limit'] = min( absint( $request->get_param( 'limit' ) ), 100 );
        }

        $assignments = Plato_Database::get_assignments_for_user( $user_id, $args );

        return new WP_REST_Response( array(
            'assignments' => $assignments,
            'total'       => count( $assignments ),
        ), 200 );
    }

    // ─── Chat Handlers ──────────────────────────────────────────────────────

    public function get_conversations_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $conversations = Plato_Database::get_conversations_for_user( $user_id );

        return new WP_REST_Response( array(
            'conversations' => $conversations,
        ), 200 );
    }

    public function create_conversation_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $title     = sanitize_text_field( $request->get_param( 'title' ) ?: 'New conversation' );
        $course_id = $request->get_param( 'course_id' ) ? absint( $request->get_param( 'course_id' ) ) : null;
        $mode      = in_array( $request->get_param( 'mode' ), array( 'socratic', 'eli5' ), true )
                     ? $request->get_param( 'mode' ) : 'socratic';

        $conv_id = Plato_Database::create_conversation( $user_id, $title, $course_id, $mode );
        if ( ! $conv_id ) {
            return new WP_Error( 'plato_create_failed', 'Failed to create conversation.', array( 'status' => 500 ) );
        }

        $conversation = Plato_Database::get_conversation( $conv_id, $user_id );

        return new WP_REST_Response( array(
            'conversation' => $conversation,
        ), 201 );
    }

    public function get_conversation_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $conv_id      = absint( $request->get_param( 'id' ) );
        $conversation = Plato_Database::get_conversation( $conv_id, $user_id );

        if ( ! $conversation ) {
            return new WP_Error( 'plato_not_found', 'Conversation not found.', array( 'status' => 404 ) );
        }

        $messages = Plato_Database::get_messages( $conv_id );

        return new WP_REST_Response( array(
            'conversation' => $conversation,
            'messages'     => $messages,
        ), 200 );
    }

    public function delete_conversation_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $conv_id = absint( $request->get_param( 'id' ) );
        $deleted = Plato_Database::delete_conversation( $conv_id, $user_id );

        if ( ! $deleted ) {
            return new WP_Error( 'plato_not_found', 'Conversation not found.', array( 'status' => 404 ) );
        }

        return new WP_REST_Response( array( 'deleted' => true ), 200 );
    }

    public function send_message_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $conv_id = absint( $request->get_param( 'id' ) );
        $content = trim( $request->get_param( 'content' ) ?? '' );

        if ( empty( $content ) ) {
            return new WP_Error( 'plato_empty_message', 'Message content is required.', array( 'status' => 400 ) );
        }

        // Verify conversation ownership.
        $conversation = Plato_Database::get_conversation( $conv_id, $user_id );
        if ( ! $conversation ) {
            return new WP_Error( 'plato_not_found', 'Conversation not found.', array( 'status' => 404 ) );
        }

        // Rate limit check.
        $msg_count = Plato_Database::count_messages_last_hour( $user_id );
        if ( $msg_count >= Plato_LLM::RATE_LIMIT ) {
            return new WP_Error( 'plato_rate_limited', 'Rate limit reached (50 messages/hour). Take a break!', array( 'status' => 429 ) );
        }

        // Save user message.
        Plato_Database::insert_message( $conv_id, 'user', $content );

        // Build message history for LLM.
        $db_messages  = Plato_Database::get_messages( $conv_id );
        $llm_messages = array();
        foreach ( $db_messages as $msg ) {
            if ( $msg->role === 'user' || $msg->role === 'assistant' ) {
                $llm_messages[] = array( 'role' => $msg->role, 'content' => $msg->content );
            }
        }

        // Get course context.
        $course = null;
        if ( $conversation->course_id ) {
            $course = Plato_Database::get_conversation( $conv_id, $user_id );
            // Fetch actual course.
            global $wpdb;
            $course = $wpdb->get_row( $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}plato_courses WHERE id = %d",
                $conversation->course_id
            ) );
        }

        // Auto-title: use first message content (trimmed).
        if ( count( $llm_messages ) === 1 ) {
            $auto_title = mb_substr( $content, 0, 60 );
            if ( mb_strlen( $content ) > 60 ) {
                $auto_title .= '...';
            }
            Plato_Database::update_conversation_title( $conv_id, $auto_title );
        }

        // Call LLM.
        $result = Plato_LLM::chat( $llm_messages, $conversation->mode, $course );
        if ( is_wp_error( $result ) ) {
            return $result;
        }

        // Save assistant message.
        $msg_id = Plato_Database::insert_message( $conv_id, 'assistant', $result['content'], $result['tokens_used'] );

        return new WP_REST_Response( array(
            'message' => array(
                'id'         => $msg_id,
                'role'       => 'assistant',
                'content'    => $result['content'],
                'created_at' => current_time( 'mysql', true ),
            ),
            'tokens_used' => $result['tokens_used'],
        ), 200 );
    }

    public function stream_message_handler( WP_REST_Request $request ) {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $conv_id = absint( $request->get_param( 'id' ) );
        $content = trim( $request->get_param( 'content' ) ?? '' );

        if ( empty( $content ) ) {
            return new WP_Error( 'plato_empty_message', 'Message content is required.', array( 'status' => 400 ) );
        }

        $conversation = Plato_Database::get_conversation( $conv_id, $user_id );
        if ( ! $conversation ) {
            return new WP_Error( 'plato_not_found', 'Conversation not found.', array( 'status' => 404 ) );
        }

        // Rate limit.
        $msg_count = Plato_Database::count_messages_last_hour( $user_id );
        if ( $msg_count >= Plato_LLM::RATE_LIMIT ) {
            return new WP_Error( 'plato_rate_limited', 'Rate limit reached (50 messages/hour).', array( 'status' => 429 ) );
        }

        // Save user message.
        Plato_Database::insert_message( $conv_id, 'user', $content );

        // Build message history.
        $db_messages  = Plato_Database::get_messages( $conv_id );
        $llm_messages = array();
        foreach ( $db_messages as $msg ) {
            if ( $msg->role === 'user' || $msg->role === 'assistant' ) {
                $llm_messages[] = array( 'role' => $msg->role, 'content' => $msg->content );
            }
        }

        // Course context.
        $course = null;
        if ( $conversation->course_id ) {
            global $wpdb;
            $course = $wpdb->get_row( $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}plato_courses WHERE id = %d",
                $conversation->course_id
            ) );
        }

        // Auto-title on first message.
        if ( count( $llm_messages ) === 1 ) {
            $auto_title = mb_substr( $content, 0, 60 );
            if ( mb_strlen( $content ) > 60 ) {
                $auto_title .= '...';
            }
            Plato_Database::update_conversation_title( $conv_id, $auto_title );
        }

        // Stream — this function does not return, it outputs SSE directly.
        // We need to capture the full response to save it after streaming.
        // Strategy: use the non-streaming endpoint for now, with a "collecting" wrapper.
        // For true SSE streaming, we'd need to save the message after the stream completes.
        // Let's use the non-streaming call but return quickly with a streaming-like response.

        // Actually, let's do proper streaming: output SSE, then save at the end.
        // We'll buffer the content ourselves.

        $api_key  = Plato_LLM::get_api_key();
        if ( ! $api_key ) {
            return new WP_Error( 'plato_llm_not_configured', 'LLM API key not configured.', array( 'status' => 400 ) );
        }

        $provider = Plato_LLM::get_provider();
        $model    = Plato_LLM::get_model();
        $system   = Plato_LLM::build_system_prompt( $conversation->mode, $course );

        // Disable output buffering, set SSE headers.
        while ( ob_get_level() ) {
            ob_end_clean();
        }
        header( 'Content-Type: text/event-stream' );
        header( 'Cache-Control: no-cache' );
        header( 'Connection: keep-alive' );
        header( 'X-Accel-Buffering: no' );

        $origin  = isset( $_SERVER['HTTP_ORIGIN'] ) ? $_SERVER['HTTP_ORIGIN'] : '';
        $allowed = array( 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://plato.local' );
        if ( in_array( $origin, $allowed, true ) ) {
            header( 'Access-Control-Allow-Origin: ' . $origin );
            header( 'Access-Control-Allow-Credentials: true' );
        }

        $full_response = '';
        $conv_id_save  = $conv_id;

        if ( $provider === Plato_LLM::PROVIDER_ANTHROPIC ) {
            $url     = 'https://api.anthropic.com/v1/messages';
            $headers = array(
                'x-api-key: ' . $api_key,
                'anthropic-version: 2023-06-01',
                'Content-Type: application/json',
            );
            $payload = wp_json_encode( array(
                'model'      => $model,
                'system'     => $system,
                'messages'   => $llm_messages,
                'max_tokens' => 1024,
                'stream'     => true,
            ) );
        } else {
            $url     = 'https://api.openai.com/v1/chat/completions';
            $headers = array(
                'Authorization: Bearer ' . $api_key,
                'Content-Type: application/json',
            );
            $api_messages = array_merge(
                array( array( 'role' => 'system', 'content' => $system ) ),
                $llm_messages
            );
            $payload = wp_json_encode( array(
                'model'       => $model,
                'messages'    => $api_messages,
                'max_tokens'  => 1024,
                'temperature' => 0.7,
                'stream'      => true,
            ) );
        }

        $ch = curl_init( $url );
        curl_setopt_array( $ch, array(
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_RETURNTRANSFER => false,
            CURLOPT_TIMEOUT        => 120,
            CURLOPT_WRITEFUNCTION  => function ( $ch, $data ) use ( $provider, &$full_response ) {
                $lines = explode( "\n", $data );
                foreach ( $lines as $line ) {
                    $line = trim( $line );
                    if ( empty( $line ) || ! str_starts_with( $line, 'data: ' ) ) {
                        continue;
                    }
                    $json_str = substr( $line, 6 );

                    if ( $provider === Plato_LLM::PROVIDER_OPENAI ) {
                        if ( $json_str === '[DONE]' ) {
                            echo "data: [DONE]\n\n";
                            if ( ob_get_level() ) ob_flush();
                            flush();
                            continue;
                        }
                        $parsed = json_decode( $json_str, true );
                        $delta  = $parsed['choices'][0]['delta']['content'] ?? '';
                        if ( $delta !== '' ) {
                            $full_response .= $delta;
                            echo 'data: ' . wp_json_encode( array( 'content' => $delta ) ) . "\n\n";
                            if ( ob_get_level() ) ob_flush();
                            flush();
                        }
                    } else {
                        $parsed = json_decode( $json_str, true );
                        if ( ! $parsed ) continue;
                        $type = $parsed['type'] ?? '';
                        if ( $type === 'content_block_delta' ) {
                            $delta = $parsed['delta']['text'] ?? '';
                            if ( $delta !== '' ) {
                                $full_response .= $delta;
                                echo 'data: ' . wp_json_encode( array( 'content' => $delta ) ) . "\n\n";
                                if ( ob_get_level() ) ob_flush();
                                flush();
                            }
                        } elseif ( $type === 'message_stop' ) {
                            echo "data: [DONE]\n\n";
                            if ( ob_get_level() ) ob_flush();
                            flush();
                        }
                    }
                }
                return strlen( $data );
            },
        ) );

        curl_exec( $ch );
        $curl_err = curl_error( $ch );
        curl_close( $ch );

        if ( $curl_err ) {
            echo 'data: ' . wp_json_encode( array( 'error' => $curl_err ) ) . "\n\n";
            flush();
        }

        // Save the full assistant response to the database.
        if ( ! empty( $full_response ) ) {
            Plato_Database::insert_message( $conv_id_save, 'assistant', $full_response );
        }

        exit;
    }

    // ─── Settings Handlers ───────────────────────────────────────────────────

    public function get_llm_settings_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        return new WP_REST_Response( array(
            'configured' => Plato_LLM::is_configured(),
            'provider'   => Plato_LLM::get_provider(),
            'model'      => Plato_LLM::get_model(),
        ), 200 );
    }

    public function save_llm_settings_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $provider = $request->get_param( 'provider' );
        $api_key  = $request->get_param( 'api_key' );
        $model    = $request->get_param( 'model' ) ?? '';

        if ( ! in_array( $provider, array( 'openai', 'anthropic' ), true ) ) {
            return new WP_Error( 'plato_invalid_provider', 'Provider must be openai or anthropic.', array( 'status' => 400 ) );
        }

        if ( empty( $api_key ) ) {
            return new WP_Error( 'plato_missing_key', 'API key is required.', array( 'status' => 400 ) );
        }

        Plato_LLM::save_settings( $provider, $api_key, $model );

        return new WP_REST_Response( array(
            'success'  => true,
            'provider' => $provider,
            'model'    => Plato_LLM::get_model(),
        ), 200 );
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function authenticate( WP_REST_Request $request ): int|WP_Error {
        return Plato_Auth::get_current_user_id();
    }
}
